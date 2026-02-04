<?php

namespace Biigle\Services\LabelBot;

use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\Label;
use Biigle\Project;
use Biigle\Role;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabelFeatureVector;
use Cache;
use DB;
use InvalidArgumentException;
use Pgvector\Laravel\Vector;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class LabelBotService
{
    public function predictLabelForImage($volumeId, $request, $annotation)
    {
        if (!$request->has('feature_vector')) {
            return Label::findOrFail($request->input('label_id'));
        }
        
        $user = $request->user();
        $topNLabels = [];
        $cacheKey = $this->enforceRateLimit($user);

        // Get label tree id(s).
        $treeIds = $this->getLabelTreeIds($user, $volumeId);
        $ignoreIds = array_map('intval', config('labelbot.ignore_label_trees'));
        $treeIds = array_diff($treeIds, $ignoreIds);

        // Convert the feature vector into a Vector object for compatibility with the query.
        $featureVector = new Vector($request->input('feature_vector'));
        $model = $this->getFeatureVectorModelFor($annotation);

        Cache::increment($cacheKey);
        try {
            $topNLabels = $this->performVectorSearch($featureVector, $treeIds, $model);
        } finally {
            $count = Cache::decrement($cacheKey);
            if ($count <= 0) {
                Cache::forget($cacheKey);
            }
        }

        if (empty($topNLabels)) {
            throw new NotFoundHttpException("LabelBOT could not find similar annotations.");
        }
        // Get labels sorted by their top N order.
        $labelModels = Label::whereIn('id', $topNLabels)->get()->keyBy('id');
        $labelBotLabels = array_map(fn ($id) => $labelModels->get($id), $topNLabels);
        
        // Add labelBOTlabels attribute to the response.
        $annotation->append('labelBOTLabels');
        $label = array_shift($labelBotLabels);
        if (!empty($labelBotLabels)) {
            // Attach the remaining labels (if any).
            $annotation->labelBOTLabels = $labelBotLabels;
        }
        
        return $label;
    }
    
    protected function enforceRateLimit($user)
    {
        $cacheKey = "labelbot-requests-{$user->id}";
        $maxRequests = config('labelbot.max_requests');
        $currentRequests = Cache::get($cacheKey, 0);

        if ($currentRequests >= $maxRequests) {
            throw new TooManyRequestsHttpException(message: "You already have {$maxRequests} pending LabelBOT requests. Please wait for one to complete before submitting a new one.");
        }
        
        return $cacheKey;
    }
    
    /**
     * Get all label trees that are used by all projects which are visible to the user.
     *
     * @param mixed $user
     * @param int $volumeId
     *
     * @return array
     */
    protected function getLabelTreeIds($user, $volumeId)
    {
        if ($user->can('sudo')) {
            // Global admins have no restrictions.
            $projectIds = DB::table('project_volume')
                ->where('volume_id', $volumeId)
                ->pluck('project_id');
        } else {
            // Array of all project IDs that the user and the image have in common
            // and where the user is editor, expert or admin.
            $projectIds = Project::inCommon($user, $volumeId, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->pluck('id');
        }

        return DB::table('label_tree_project')
            ->whereIn('project_id', $projectIds)
            ->pluck('label_tree_id')
            ->toArray();
    }

    /**
     * Perform vector search using the Dynamic Index Switching (DIS) technique.
     *
     * The search process first attempts to retrieve results using an Approximate Nearest Neighbor (ANN) search
     * via the HNSW index. If the ANN search returns no results, it falls back to an exact KNN search using the
     * B-Tree index for filtering, ensuring that results are always returned.
     *
     * @param vector $featureVector The input feature vector to search for nearest neighbors.
     * @param int[] $trees The label tree IDs to filter the data by.
     * @param string $model Class name of the feature vector model to use
     *
     * @return array The array of top N labels that are the closest to the input feature vector.
     */
    protected function performVectorSearch($featureVector, $trees, $model)
    {
        // Perform ANN search.
        $topNLabels = $this->performAnnSearch($featureVector, $trees, $model);

        // Perform ANN search with iterative index scan + post filtering as a fallback if ANN search returns no results.
        if (empty($topNLabels)) {
            $topNLabels = $this->performAnnSearchWithIterativeIndexScan($featureVector, $trees, $model);
        }

        return $topNLabels;
    }

    /**
     * Perform Approximate Nearest Neighbor (ANN) search using the HNSW index with Post-Subquery Filtering (PSF).
     *
     * The search uses the HNSW index to find the top K nearest neighbors of the input feature vector,
     * and then applies filtering based on the label_tree_id values. If no results are found or if the filtering
     * removes all results, an empty array is returned.
     *
     * @param Vector $featureVector The input feature vector to search for nearest neighbors.
     * @param int[] $trees The label tree IDs to filter the data by.
     *
     * @return array The array of label IDs representing the top nearest neighbors.
    */
    protected function performAnnSearch($featureVector, $trees, $model)
    {
        // Size of the dynamic candidate list during the search process.
        // K is always bounded by this value so we set it to K.
        $k = config('labelbot.K');
        DB::statement("SET hnsw.ef_search = $k");

        $subquery = $model::select('label_id', 'label_tree_id')
            ->selectRaw('(vector <=> ?) AS distance', [$featureVector])
            ->orderBy('distance')
            ->limit($k);
        
        return DB::query()->fromSub($subquery, 'subquery')
            ->whereIn('label_tree_id', $trees)
            ->groupBy('label_id')
            ->orderByRaw('MIN(distance)')
            ->limit(config('labelbot.N'))
            ->pluck('label_id')
            ->toArray();
    }

    /**
     * Perform Approximate Nearest Neighbor (ANN) search using the HNSW iterative index
     * scan.
     *
     * The search uses the HNSW iterative index scan to find the top K nearest neighbors
     * of the input feature vector, and then applies filtering based on the label_tree_id
     * values. If the filtering removes all results, the iterative scan will
     * automatically scan more of the index until enough results are found (or it reaches
     * hnsw.max_scan_tuples, which is 20,000 by default), finally if no results are
     * found, an empty array is returned.
     *
     * @param Vector $featureVector The input feature vector to search for nearest neighbors.
     * @param int[] $trees The label tree IDs to filter the data by.
     *
     * @return array The array of label IDs representing the top nearest neighbors.
    */
    protected function performAnnSearchWithIterativeIndexScan($featureVector, $trees, $model)
    {

        // Size of the dynamic candidate list during the search process.
        // K is always bounded by this value so we set it to K.
        $k = config('labelbot.K');
        DB::statement("SET hnsw.ef_search = $k");

        # Iterative scans can use strict or relaxed ordering.
        # Strict ensures results are in the exact order by distance
        # Relaxed allows results to be slightly out of order by distance, but provides better recall
        # See https://github.com/pgvector/pgvector?tab=readme-ov-file#iterative-index-scans for more details
        #
        # We will use relaxed order because it's slightly faster and we are sorting the subquery results anyway.
        DB::statement("SET hnsw.iterative_scan = relaxed_order");

        $subquery = $model::select('label_id', 'label_tree_id')
            ->selectRaw('(vector <=> ?) AS distance', [$featureVector])
            ->whereIn('label_tree_id', $trees) // Filtering in the subquery is required otherwise the iterative scan would not work.
            ->orderBy('distance')
            ->limit($k);

        return DB::query()->fromSub($subquery, 'subquery')
            ->groupBy('label_id')
            ->orderByRaw('MIN(distance)')
            ->limit(config('labelbot.N'))
            ->pluck('label_id')
            ->toArray();
    }
    
    protected function getFeatureVectorModelFor($annotation)
    {
        if ($annotation instanceof ImageAnnotation) {
            return ImageAnnotationLabelFeatureVector::class;
        } elseif ($annotation instanceof VideoAnnotation) {
            return VideoAnnotationLabelFeatureVector::class;
        }
        
        throw new InvalidArgumentException("Invalid annotation passed to labelbot service");
    }
}
