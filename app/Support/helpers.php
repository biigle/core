<?php

use Illuminate\Support\Facades\Storage;
use Biigle\Role;
use Biigle\Project;
use Biigle\LabelTree;
use Pgvector\Laravel\Vector;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;

if (!function_exists('cachebust_asset')) {
    /**
     * Generate an asset path with a cachbusting query string for the application.
     *
     * @param  string  $path
     * @param  bool    $secure
     * @return string
     */
    function cachebust_asset($path, $secure = null)
    {
        $publicPath = public_path($path);
        if (file_exists($publicPath)) {
            $path .= '?'.filemtime($publicPath);
        }

        return asset($path, $secure);
    }
}

if (!function_exists('readable_number')) {
    /**
     * Shorten a large number to a readable size, e.g. 154222 => 154k.
     *
     * @param  int|float  $n
     * @return string
     */
    function readable_number($n)
    {
        $divisor = 1.0;
        $suffix = '';

        foreach (['', 'k', 'M', 'G', 'T'] as $s) {
            $nextDivisor = $divisor * 1000.0;
            if ($n < $nextDivisor) {
                $suffix = $s;
                break;
            }

            $divisor = $nextDivisor;
        }

        return round($n / $divisor).$suffix;
    }
}

if (!function_exists('fragment_uuid_path')) {
    /**
     * Fragment a UUID beginning with "abcdef..."" to "ab/cd/abcdef...".
     *
     * @param  string $uuid
     * @return string
     */
    function fragment_uuid_path($uuid)
    {
        return "{$uuid[0]}{$uuid[1]}/{$uuid[2]}{$uuid[3]}/{$uuid}";
    }
}

if (!function_exists('thumbnail_url')) {
    /**
     * Assemble the public URL to an image thumbnail.
     *
     * @param  string $uuid
     * @param string $disk
     * @param string $format
     * @return string
     */
    function thumbnail_url($uuid = null, $disk = null, $format = null)
    {
        if (is_null($format)) {
            $format = config('thumbnails.format');
        }

        if (is_null($disk)) {
            $disk = config('thumbnails.storage_disk');
        }

        if (is_null($uuid)) {
            return Storage::disk($disk)->url('');
        } elseif (strpos($uuid, ':') !== 0) {
            // If the uuid starts with a : it is a template string and should not be
            // fragmented.
            $uuid = fragment_uuid_path($uuid);
        }

        return Storage::disk($disk)->url("{$uuid}.{$format}");
    }
}

if (!function_exists('get_label_tree_ids')) {
    /**
     * Get all label trees that are used by all projects which are visible to the user.
     * 
     * @param mixed $user
     * @param int $volumeId
     */
    function get_label_tree_ids($user, $volumeId) {
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
        $trees = LabelTree::select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->whereIn('id', function ($query) use ($projectIds) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projectIds);
            })
        ->pluck('id')
        ->toArray();

        return $trees;
    }
}

if (!function_exists('perform_ann_search')) {
    /**
     * Perform ANN (HNSW + Post-Subquery-Filtering) search.
     * 
     * @param vector $featureVector
     * @param int[] $trees
     */
    function perform_ann_search($featureVector, $trees) {
        $featureVector = new Vector($featureVector);

        $subquery = ImageAnnotationLabelFeatureVector::select('label_id', 'label_tree_id')
        ->selectRaw('(vector <=> ?) AS distance', [$featureVector])
        ->orderBy('distance')
        // K = 100
        ->limit(config('labelbot.K'));

        return  DB::table(DB::raw("({$subquery->toSql()}) as subquery"))
        ->setBindings([$featureVector])
        ->whereIn('label_tree_id', $trees)
        ->select('label_id')
        ->groupBy('label_id')
        ->orderByRaw('MIN(distance)')
        ->limit(config('labelbot.N'))
        ->pluck('label_id')
        ->toArray();
    }
}

if (!function_exists('perform_knn_search')) {
    /**
     * Perform KNN (B-Tree + Post-Filtering) search.
     * 
     * @param Vector $featureVector
     * @param int[] $trees
     */
    function perform_knn_search($featureVector, $trees) {
        $featureVector = new Vector($featureVector);

        $subquery = ImageAnnotationLabelFeatureVector::select('label_id', 'label_tree_id')
        ->selectRaw('(vector <=> ?) AS distance', [$featureVector])
        // filter by label tree id in subquery
        // to use B-Tree index for filtering and speeding up the vector search
        ->whereIn('label_tree_id', $trees)  
        ->orderBy('distance')
        ->limit(config('labelbot.K')); // K = 100

        // TODO: Drop HNSW index temporary
        // DB::beginTransaction();

        $topNLabels = DB::table(DB::raw("({$subquery->toSql()}) as subquery"))
        ->setBindings(array_merge([$featureVector], $trees))
        ->select('label_id')
        ->groupBy('label_id')
        ->orderByRaw('MIN(distance)')
        ->limit(config('labelbot.N')) // N = 3
        ->pluck('label_id')
        ->toArray();

        // TODO: Rollback the HNSW index drop
        // DB::rollback();

        return $topNLabels;
    }

}
