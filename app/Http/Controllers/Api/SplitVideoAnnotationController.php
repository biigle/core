<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\SplitVideoAnnotation;
use Biigle\VideoAnnotation;
use Biigle\VideoAnnotationLabel;
use DB;

class SplitVideoAnnotationController extends Controller
{
    /**
     * Split the video annotation
     *
     * @api {post} video-annotations/:id/split Split an annotation
     * @apiGroup VideoAnnotations
     * @apiName SplitVideoAnnotation
     * @apiPermission projectEditor
     * @apiDescription Only point, rectangle, circle and whole frame annotations can be split.
     * Returns an array with the updated old annotation as first element and the split
     * new annotation as the second element.
     *
     * @apiParam {Number} id The video annotation ID.
     * @apiParam (Required attributes) {Number} time Time at which the annotation should be split.
     *
     * @apiSuccessExample {json} Success example:
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
     * @return array<int, VideoAnnotation>
     */
    public function store(SplitVideoAnnotation $request)
    {
        $time = $request->input('time');
        $oldAnnotation = $request->annotation;
        $oldFrames = $oldAnnotation->frames;
        $oldPoints = $oldAnnotation->points;

        $i = count($oldFrames) - 1;
        for (; $i >= 0 ; $i--) {
            if ($oldFrames[$i] <= $time && $oldFrames[$i] !== null) {
                break;
            }
        }

        if ($oldFrames[$i + 1] === null) {
            // The annotation should be split at a gap. Remove the gap to create two
            // separate annotations in this case.
            $newFrames = array_splice($oldFrames, $i + 2);
            $newPoints = array_splice($oldPoints, $i + 2);
            array_pop($oldFrames);
            array_pop($oldPoints);
        } else {
            // The annotation should be split regularly. Determine the interpolated
            // points at this time and create two annotations, the first ends at the
            // interpolated points and the second starts there.
            $newFrames = array_splice($oldFrames, $i + 1);
            $newPoints = array_splice($oldPoints, $i + 1);

            if ($oldFrames[$i] === $time) {
                // The annotation should be split at a keyframe. We don't need to
                // interpolate a new point in this case, just add the keyframe to the
                // new annotation.
                array_unshift($newFrames, $time);
                // Exclude whole frame annotations without points.
                if (!empty($oldPoints)) {
                    array_unshift($newPoints, $oldPoints[$i]);
                }
            } else {
                // Exclude whole frame annotations without points.
                if (!empty($oldPoints)) {
                    $middlePoint = $oldAnnotation->interpolatePoints($time);
                    array_push($oldPoints, $middlePoint);
                    array_unshift($newPoints, $middlePoint);
                }
                array_push($oldFrames, $time);
                array_unshift($newFrames, $time);
            }
        }

        $newAnnotation = new VideoAnnotation([
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
                    'annotation_id' => $newAnnotation->id,
                ]);
            });
        });

        $oldAnnotation->load('labels.label', 'labels.user');
        $newAnnotation->load('labels.label', 'labels.user');

        return [$oldAnnotation, $newAnnotation];
    }
}
