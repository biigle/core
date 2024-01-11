<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\Volume;

class SortAnnotationsByOutliersController extends Controller
{
    /**
     * Sort annotations with specific label by outliers.
     *
     * @api {get} volumes/:vid/annotations/sort/outliers/:lid Sort annotations with the same label by outliers
     * @apiGroup Volumes
     * @apiName ShowVolumesAnnotationsSortOutliers
     * @apiParam {Number} vid The volume ID
     * @apiParam {Number} lid The Label ID
     * @apiPermission projectMember
     * @apiDescription Returns a list of image/video annotation IDs with the outliers first.
     *
     * @param  int  $vid Volume ID
     * @param int $lid Label ID
     * @return \Illuminate\Http\Response
     */
    public function index($vid, $lid)
    {
        $volume = Volume::findOrFail($vid);
        $this->authorize('access', $volume);

        if ($volume->isVideoVolume()) {
            $query = VideoAnnotationLabelFeatureVector::where('volume_id', $vid)
                ->where('label_id', $lid)
                ->orderByRaw('vector <=> (SELECT avg(vector) FROM video_annotation_label_feature_vectors WHERE volume_id = ? AND label_id = ?) DESC, annotation_id ASC', [$vid, $lid]);
        } else {
            $query = ImageAnnotationLabelFeatureVector::where('volume_id', $vid)
                ->where('label_id', $lid)
                ->orderByRaw('vector <=> (SELECT avg(vector) FROM image_annotation_label_feature_vectors WHERE volume_id = ? AND label_id = ?) DESC, annotation_id ASC', [$vid, $lid]);
        }

        return $query->pluck('annotation_id')
            // Use distinct/unique *after* fetchig from the DB because otherwise the
            // vector would need to be selected, too (order by expressions must appear in
            // the select list). But we don't want to get the huge vectors.
            ->unique();
    }
}
