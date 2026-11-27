<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\Traits\RestrictsToAnnotationSession;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabelFeatureVector;
use Biigle\Volume;
use Illuminate\Http\Request;

class SortAnnotationsByOutliersController extends Controller
{
    use RestrictsToAnnotationSession;

    /**
     * Sort annotations with specific label by outliers.
     *
     * @api {get} volumes/:vid/annotations/sort/outliers/:lid Sort annotations with the same label by outliers
     * @apiGroup Volumes
     * @apiName ShowVolumesAnnotationsSortOutliers
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The Label ID
     * @apiPermission projectMember
     * @apiDescription Returns a list of image/video annotation IDs with the outliers first. Annotations that are hidden by an active annotation session are not included.
     *
     * @param Request $request
     * @param  int  $vid Volume ID
     * @param int $lid Label ID
     * @return \Illuminate\Support\Collection
     */
    public function index(Request $request, $vid, $lid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);
        $user = $request->user();
        $session = $volume->getActiveAnnotationSession($user);

        if ($volume->isVideoVolume()) {
            $query = VideoAnnotationLabelFeatureVector::where('volume_id', $vid)
                ->where('label_id', $lid)
                ->orderByRaw('vector <=> (SELECT AVG(vector) FROM video_annotation_label_feature_vectors WHERE volume_id = ? AND label_id = ?) DESC, annotation_id DESC', [$vid, $lid]);
        } else {
            $query = ImageAnnotationLabelFeatureVector::where('volume_id', $vid)
                ->where('label_id', $lid)
                ->orderByRaw('vector <=> (SELECT AVG(vector) FROM image_annotation_label_feature_vectors WHERE volume_id = ? AND label_id = ?) DESC, annotation_id DESC', [$vid, $lid]);
        }

        if ($session) {
            $annotation = $volume->isVideoVolume() ? new VideoAnnotation : new ImageAnnotation;
            $this->restrictFeatureVectorsToSession($query, $session, $user, $annotation);
        }

        return $query->pluck('annotation_id')
            // Use distinct/unique *after* fetchig from the DB because otherwise the
            // vector would need to be selected, too (order by expressions must appear in
            // the select list). But we don't want to get the huge vectors.
            ->unique()
            ->values();
    }
}
