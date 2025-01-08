<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreImageAnnotation;
use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabel;
use Biigle\Label;
use Biigle\LabelTree;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Project;
use Biigle\Role;
use Biigle\Shape;
use DB;
use Exception;
use Generator;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Pgvector\Laravel\Vector;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;

class ImageAnnotationController extends Controller
{
    /**
     * Shows a list of all annotations of the specified image.
     *
     * @api {get} images/:id/annotations Get all annotations
     * @apiGroup Images
     * @apiName IndexImageAnnotations
     * @apiPermission projectMember
     * @apiDescription If there is an active annotation session for the volume of this image, only those annotations will be returned that the user is allowed to access.
     *
     * @apiParam {Number} id The image ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "image_id": 1,
     *       "shape_id": 1,
     *       "created_at": "2015-02-18 11:45:00",
     *       "updated_at": "2015-02-18 11:45:00",
     *       "points": [100, 200],
     *       "labels": [
     *          {
     *             "id": 1,
     *             "annotation_id": 1,
     *             "label_id": 3,
     *             "user_id": 4,
     *             "label": {
     *                "color": "bada55",
     *                "id": 3,
     *                "name": "My label",
     *                "parent_id": null,
     *                "label_tree_id": 1,
     *             },
     *             "user": {
     *                "id": 4,
     *                "firstname": "Graham",
     *                "lastname": "Hahn",
     *             }
     *          }
     *       ]
     *    }
     * ]
     *
     * @param Request $request
     * @param int $id image id
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function index(Request $request, $id)
    {
        $image = Image::findOrFail($id);
        $this->authorize('access', $image);
        $user = $request->user();
        $session = $image->volume->getActiveAnnotationSession($user);

        $load = [
            // Hide confidence.
            'labels:id,annotation_id,label_id,user_id',
            // Hide label_source_id and source_id.
            'labels.label:id,name,parent_id,color,label_tree_id',
            // Hide role_id.
            'labels.user:id,firstname,lastname',
        ];

        // Prevent exceeding memory limit by using generator and stream
        if ($session) {
            $yieldAnnotations = $session->getVolumeFileAnnotations($image, $user, $load);
        } else {
            $yieldAnnotations = function () use ($image, $load): Generator {
                foreach ($image->annotations()->with($load)->lazy() as $annotation) {
                    yield $annotation;
                }
            };
        }
    
        return new StreamedJsonResponse($yieldAnnotations());
    }

    /**
     * @api {get} annotations/:id Get an annotation
     * @apiDeprecated use now (#ImageAnnotations:ShowImageAnnotation).
     * @apiGroup Annotations
     * @apiName ShowAnnotation
     * @apiParam {Number} id The annotation ID.
     * @apiPermission projectMember
     * @apiDescription Access may be denied by an active annotation session of the volume, the annotation belongs to.
     * @apiSuccessExample {json} Success response:
     * {
     *    "id":1,
     *    "image_id":1,
     *    "shape_id":1,
     *    "created_at":"2015-02-13 11:59:23",
     *    "updated_at":"2015-02-13 11:59:23",
     *    "points": [100, 100]
     * }
     */

    /**
     * Displays the annotation.
     *
     * @api {get} image-annotations/:id Get an annotation
     * @apiGroup ImageAnnotations
     * @apiName ShowImageAnnotation
     * @apiParam {Number} id The annotation ID.
     * @apiPermission projectMember
     * @apiDescription Access may be denied by an active annotation session of the volume, the annotation belongs to.
     * @apiSuccessExample {json} Success response:
     * {
     *    "id":1,
     *    "image_id":1,
     *    "shape_id":1,
     *    "created_at":"2015-02-13 11:59:23",
     *    "updated_at":"2015-02-13 11:59:23",
     *    "points": [100, 100]
     * }
     *
     * @param  int  $id
     * @return ImageAnnotation
     */
    public function show($id)
    {
        $annotation = ImageAnnotation::findOrFail($id);
        $this->authorize('access', $annotation);

        return $annotation;
    }

    /**
     * Creates a new annotation in the specified image.
     *
     * @api {post} images/:id/annotations Create a new annotation
     * @apiGroup ImageAnnotations
     * @apiName StoreImageAnnotations
     * @apiPermission projectEditor
     * @apiDescription Only labels may be used that belong to a label tree used by one of
     * the projects, the image belongs to.
     *
     * @apiParam {Number} id The image ID.
     *
     * @apiParam (Required arguments) {Number} shape_id ID of the shape of the new annotation.
     * @apiParam (Required arguments) {Number} label_id ID of the initial category label of the new annotation. Required if 'feature_vector' is not provided.
     * @apiParam (Required arguments) {Number[]} feature_vector A feature vector array of size 384 for label prediction. Required if 'label_id' is not provided.
     * @apiParam (Required arguments) {Number} confidence Confidence of the initial annotation label of the new annotation. Must be a value between 0 and 1.
     * @apiParam (Required arguments) {Number[]} points Array of the initial points of the annotation. Must contain at least one point. The points array is interpreted as alternating x and y coordinates like this `[x1, y1, x2, y2...]`. The interpretation of the points of the different shapes is as follows:
     * **Point:** The first point is the center of the annotation point.
     * **Rectangle:** The first four points are the vertices of the rectangle (in the given order).
     * **Polygon:** Like rectangle with one or more vertices. The first and last vertices of a polygon must have the same coordinates.
     * **LineString:** Like rectangle with one or more vertices.
     * **Circle:** The first point is the center of the circle. The third value of the points array is the radius of the circle. A valid points array of a circle might look like this: `[10, 10, 5]`.
     * **Ellipse:** The four points specify the end points of the semi-major and semi-minor axes of the ellipse in (counter-)clockwise ordering (depending on how the ellipse was drawn). So the first point is the end point of axis 1, the second is the end point of axis 2, the third is the other end point of axis 1 and the fourth is the other end point of axis 2.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * {
     *    "shape_id": 3,
     *    "label_id": 1,
     *    "confidence": 0.75,
     *    "points": [10, 11, 20, 21]
     * }
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "created_at": "2015-02-18 11:45:00",
     *    "id": 1,
     *    "image_id": 1,
     *    "shape_id": 3,
     *    "updated_at": "2015-02-18 11:45:00",
     *    "points": [10, 11, 20, 21],
     *    "labels": [
     *       {
     *          "confidence": 1,
     *          "id": 1,
     *          "label": {
     *             "color": "bada55",
     *             "id": 3,
     *             "name": "My label",
     *             "parent_id": null,
     *             "project_id": null
     *          },
     *          "user": {
     *             "id": 4,
     *             "firstname": "Graham",
     *             "lastname": "Hahn",
     *             "role_id": 2
     *          }
     *       }
     *    ]
     * }
     *
     * @param StoreImageAnnotation $request
     * @return ImageAnnotation
     */
    public function store(StoreImageAnnotation $request)
    {
        $points = $request->input('points');

        $annotation = new ImageAnnotation;
        $annotation->shape_id = $request->input('shape_id');
        $image = $request->image;
        $annotation->image()->associate($image);
        try {
            $annotation->validatePoints($points);
        } catch (Exception $e) {
            throw ValidationException::withMessages(['points' => [$e->getMessage()]]);
        }

        $annotation->points = $points;
        $labelId = $request->input('label_id');
        $topNLabels = [];
        if (is_null($labelId) && $request->has('feature_vector')) {
            // Add labelBOTlabels attribute to the response.
            $annotation->append('labelBOTLabels');

            // Get label tree id(s).
            $trees = $this->getLabelTreeIds($request->user(), $image->volume_id);

            // Convert the feature vector into a Vector object for compatibility with the query.
            $featureVector = new Vector($request->input('feature_vector'));

            // Perform vector search.
            $topNLabels = $this->performVectorSearch($featureVector, $trees, $topNLabels);
            
            // Set labelId to top 1 label.
            $labelId = $topNLabels[0];
        }

        $label = Label::findOrFail($labelId);

        $this->authorize('attach-label', [$annotation, $label]);

        DB::transaction(function () use ($annotation, $request, $label) {
            $annotation->save();
            $annotationLabel = new ImageAnnotationLabel;
            $annotationLabel->label_id = $label->id;
            $annotationLabel->user_id = $request->user()->id;
            $annotationLabel->confidence = $request->input('confidence');
            $annotation->labels()->save($annotationLabel);
        });

        $annotation->load('labels.label', 'labels.user');

        // Attach the other two labels if they exist.
        $annotation->labelBOTLabels = Label::whereIn('id', array_slice($topNLabels, 1))->get()->toArray();

        return $annotation;
    }

    /**
     * @api {put} annotations/:id Update an annotation
     * @apiDeprecated use now (#ImageAnnotations:UpdateImageAnnotation).
     * @apiGroup Annotations
     * @apiName UpdateAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     * @apiParam (Attributes that can be updated) {Number} shape_id ID of the new shape of the annotation.
     * @apiParam (Attributes that can be updated) {Number[]} points Array of new points of the annotation. The new points will replace the old points. See the "Create a new annotation" endpoint for how the points are interpreted for different shapes.
     * @apiParamExample {json} Request example (JSON):
     * {
     *    "points": [10, 11, 20, 21],
     *    "shape_id": 3
     * }
     */

    /**
     * Updates the annotation including its points.
     *
     * @api {put} image-annotations/:id Update an annotation
     * @apiGroup ImageAnnotations
     * @apiName UpdateImageAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     * @apiParam (Attributes that can be updated) {Number} shape_id ID of the new shape of the annotation.
     * @apiParam (Attributes that can be updated) {Number[]} points Array of new points of the annotation. The new points will replace the old points. See the "Create a new annotation" endpoint for how the points are interpreted for different shapes.
     * @apiParamExample {json} Request example (JSON):
     * {
     *    "points": [10, 11, 20, 21],
     *    "shape_id": 3
     * }
     *
     * @param Request $request
     * @param  int  $id
     */
    public function update(Request $request, $id)
    {
        $annotation = ImageAnnotation::findOrFail($id);
        $this->authorize('update', $annotation);
        $request->validate([
            'shape_id' => 'required_without:points|integer|exists:shapes,id',
            'points' => 'required_without:shape_id|array',
        ]);

        // from a JSON request, the array may already be decoded
        $points = $request->input('points', $annotation->points);
        $annotation->shape_id = $request->input('shape_id', $annotation->shape_id);

        try {
            $annotation->validatePoints($points);
        } catch (Exception $e) {
            throw ValidationException::withMessages(['points' => [$e->getMessage()]]);
        }

        $annotation->points = $points;
        $annotation->save();
    }

    /**
     * @api {delete} annotations/:id Delete an annotation
     * @apiDeprecated use now (#ImageAnnotations:DestroyImageAnnotation).
     * @apiGroup Annotations
     * @apiName DestroyAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     */

    /**
     * Removes the annotation.
     *
     * @api {delete} image-annotations/:id Delete an annotation
     * @apiGroup ImageAnnotations
     * @apiName DestroyImageAnnotation
     * @apiPermission projectEditor
     *
     * @apiParam {Number} id The annotation ID.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $annotation = ImageAnnotation::findOrFail($id);
        $this->authorize('destroy', $annotation);

        $annotation->delete();

        return response('Deleted.', 200);
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

    /**
     * Perform vector search using the Dynamic Index Switching (DIS) technique.
     *
     * The search process first attempts to retrieve results using an Approximate Nearest Neighbor (ANN) search
     * via the HNSW index. If the ANN search returns no results, it falls back to an exact KNN search using the
     * B-Tree index for filtering, ensuring that results are always returned.
     *
     * @param vector $featureVector The input feature vector to search for nearest neighbors.
     * @param int[] $trees The label tree IDs to filter the data by.
     * @param int[] $topNLabels The array to store the top N labels based on the search results.
     *
     * @return array The array of top N labels that are the closest to the input feature vector.
     */
    protected function performVectorSearch($featureVector, $trees, $topNLabels)
    {
        // Perform ANN search.
        $topNLabels = $this->performAnnSearch($featureVector, $trees);

        // Perform KNN search as a fallback if ANN search returns no results.
        if (empty($topNLabels)) {
            $topNLabels = $this->performKnnSearch($featureVector, $trees);
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
    protected function performAnnSearch($featureVector, $trees)
    {
        // check if the HNSW index exists
        if (!$this->indexExists(config('labelbot.HNSW_ImgAnno_index_name'))) {
            return [];
        }
        $subquery = ImageAnnotationLabelFeatureVector::select('label_id', 'label_tree_id')
            ->selectRaw('(vector <=> ?) AS distance', [$featureVector])
            ->orderBy('distance')
            ->limit(config('labelbot.K')); // K = 100

        return DB::query()->fromSub($subquery, 'subquery')
            ->whereIn('label_tree_id', $trees)
            ->groupBy('label_id')
            ->orderByRaw('MIN(distance)')
            ->limit(config('labelbot.N')) // N = 3
            ->pluck('label_id')
            ->toArray();
    }

    /**
     * Perform exact KNN search using the B-Tree index for filtering.
     *
     * This search filters the data based on label_tree_id using the B-Tree index,
     * and then performs the vector search to find the nearest neighbors of the input feature vector.
     * This method is used as a fallback when the ANN search does not return results.
     *
     * @param Vector $featureVector The input feature vector to search for nearest neighbors.
     * @param int[] $trees The label tree IDs to filter the data by.
     *
     * @return array The array of label IDs representing the top nearest neighbors.
    */
    protected function performKnnSearch($featureVector, $trees)
    {
        // Drop HNSW index temporarily
        DB::beginTransaction();
        $this->dropHNSWIndex();

        $subquery = ImageAnnotationLabelFeatureVector::select('label_id', 'label_tree_id')
            ->selectRaw('(vector <=> ?) AS distance', [$featureVector])
            ->whereIn('label_tree_id', $trees) // Apply label tree ID filter in the subquery to use the B-Tree index for faster filtering
            ->orderBy('distance')
            ->limit(config('labelbot.K')); // K = 100

        // Save results.
        $topNLabels = DB::query()->fromSub($subquery, 'subquery')
            ->groupBy('label_id')
            ->orderByRaw('MIN(distance)')
            ->limit(config('labelbot.N')) // N = 3
            ->pluck('label_id')
            ->toArray();

        // Rollback the HNSW index drop
        DB::rollback();

        return $topNLabels;
    }

    /**
     * Check if the index exists.
     *
     * @param string $indexName The index name.
     *
     * @return boolean
     */
    protected function indexExists($indexName)
    {
        return !empty(DB::select("SELECT indexname FROM pg_indexes WHERE indexname = '$indexName'"));
    }

    /**
     * Drop the HNSW index if exists. This step is necessary to perform exact KNN search
     * because the planner almost always prioritize the HNSW index to perform vector search.
     */
    protected function dropHNSWIndex()
    {
        // Check if the index exists
        $indexName = config('labelbot.HNSW_ImgAnno_index_name');
        if ($this->indexExists($indexName)) {
            // Drop the index
            DB::statement("DROP INDEX $indexName");
        }
    }
}
