<?php

namespace Biigle\Modules\Videos\Http\Controllers\Api;

use DB;
use Biigle\Modules\Videos\VideoAnnotation;
use Biigle\Http\Controllers\Api\Controller;
use Biigle\Modules\Videos\VideoAnnotationLabel;
use Biigle\Modules\Videos\Http\Requests\SplitVideoAnnotation;

class SplitVideoAnnotationController extends Controller
{
    /**
     * Split the video annotation
     *
     * @api {put} video-annotations/:id/split Split an annotation
     * @apiGroup VideoAnnotations
     * @apiName SplitVideoAnnotation
     * @apiPermission projectEditor
     * @apiDescription Returns an array with the updated old annotation as first element
     * and the split new annotation as the second element.
     *
     * @apiParam {Number} id The video annotation ID.
     * @apiParam (Required attributes) {Number} time Time at which the annotation should be split.
     *
     * @apiParamExample {json} Request example (JSON):
     * [
     *    {
     *       "id": 1,
     *       "created_at": "2015-02-18 11:45:00",
     *       "updated_at": "2018-02-06 09:34:00",
     *       "video_id": 1,
     *       "shape_id": 1,
     *       "frames": [10.0, 12.5]
     *       "points": [[100, 200],[150, 250]],
     *       "labels": [
     *          {
     *             "id": 1,
     *             "label": {
     *                "color": "bada55",
     *                "id": 3,
     *                "name": "My label",
     *                "parent_id": null,
     *             },
     *             "user": {
     *                "id": 4,
     *                "firstname": "Graham",
     *                "lastname": "Hahn",
     *             }
     *          }
     *       ]
     *    },
     *    {
     *       "id": 2,
     *       "updated_at": "2018-02-06 09:34:00",
     *       "updated_at": "2018-02-06 09:34:00",
     *       "video_id": 1,
     *       "shape_id": 1,
     *       "frames": [12.5, 15.0]
     *       "points": [[150, 250],[200, 300]],
     *       "labels": [
     *          {
     *             "id": 1,
     *             "label": {
     *                "color": "bada55",
     *                "id": 3,
     *                "name": "My label",
     *                "parent_id": null,
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
     * @param SplitVideoAnnotation $request
     * @return \Illuminate\Http\Response
     */
    public function store(SplitVideoAnnotation $request)
    {
        $time = $request->input('time');
        $oldAnnotation = $request->annotation;
        $oldFrames = $oldAnnotation->frames;
        $oldPoints = $oldAnnotation->points;
        $middlePoint = $oldAnnotation->interpolatePoints($time);

        $i = count($oldFrames) - 1;
        for (; $i >= 0 ; $i--) {
            if ($oldFrames[$i] <= $time) {
                break;
            }
        }

        $newFrames = array_splice($oldFrames, $i + 1);
        $newPoints = array_splice($oldPoints, $i + 1);
        array_push($oldFrames, $time);
        array_push($oldPoints, $middlePoint);
        array_unshift($newFrames, $time);
        array_unshift($newPoints, $middlePoint);

        $newAnnotation = VideoAnnotation::make([
            'video_id' => $oldAnnotation->video_id,
            'shape_id' => $oldAnnotation->shape_id,
            'points' => $newPoints,
            'frames' => $newFrames,
        ]);

        $oldAnnotation->points = $oldPoints;
        $oldAnnotation->frames = $oldFrames;

        DB::transaction(function () use ($oldAnnotation, $newAnnotation) {
            $oldAnnotation->save();
            $newAnnotation->save();
            $oldAnnotation->labels->each(function ($label) use ($newAnnotation) {
                VideoAnnotationLabel::create([
                    'label_id' => $label->label_id,
                    'user_id' => $label->user_id,
                    'video_annotation_id' => $newAnnotation->id,
                ]);
            });
        });

        $oldAnnotation->load('labels.label', 'labels.user');
        $newAnnotation->load('labels.label', 'labels.user');

        return [$oldAnnotation, $newAnnotation];
    }
}
