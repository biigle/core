<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\LinkVideoAnnotation;
use Biigle\VideoAnnotation;
use DB;

class LinkVideoAnnotationController extends Controller
{
    /**
     * Link two video annotations
     *
     * @api {post} video-annotations/:id/link Link two annotations
     * @apiGroup VideoAnnotations
     * @apiName LinkVideoAnnotations
     * @apiPermission projectEditor
     * @apiDescription The labels of the two annotations will be merged. If the two
     * annotations do not touch, the result is an annotation with a gap. One part of the
     * annotation stops before a `null` frame and the next part starts after the `null`
     * frame. Annotations with gaps can be used if the same object disappears from a
     * video and reappears later. If the annotations touch, they will be merged without
     * a gap and the keyframe of the annotation that starts first will be used as
     * keyframe at the time where the annotations touch.
     *
     * @apiParam {Number} id The video annotation ID.
     * @apiParam (Required attributes) {Number} annotation_id ID of the other video annotation.
     *
     * @apiSuccessExample {json} Success example:
     * {
     *    "id": 1,
     *    "created_at": "2015-02-18 11:45:00",
     *    "updated_at": "2018-02-06 09:34:00",
     *    "video_id": 1,
     *    "shape_id": 1,
     *    "frames": [1.0, 2.0, null, 3.0, 4.0]
     *    "points": [[10, 10], [20, 20], [], [30, 30], [40, 40]],
     *    "labels": [
     *       {
     *          "id": 1,
     *          "label": {
     *             "color": "bada55",
     *             "id": 3,
     *             "name": "My label",
     *             "parent_id": null,
     *          },
     *          "user": {
     *             "id": 4,
     *             "firstname": "Graham",
     *             "lastname": "Hahn",
     *          }
     *       }
     *    ]
     * }
     *
     * @param LinkVideoAnnotation $request
     * @return VideoAnnotation
     */
    public function store(LinkVideoAnnotation $request)
    {
        $first = $request->firstAnnotation;
        $second = $request->secondAnnotation;

        if ($first->frames[0] <= $second->frames[0]) {
            $firstFrames = $first->frames;
            $firstPoints = $first->points;
            $secondFrames = $second->frames;
            $secondPoints = $second->points;
        } else {
            $firstFrames = $second->frames;
            $firstPoints = $second->points;
            $secondFrames = $first->frames;
            $secondPoints = $first->points;
        }

        $distance = abs($firstFrames[count($firstFrames) - 1] - $secondFrames[0]);
        if ($distance < 0.1) {
            // If the annotations touch, use the keyframe of the first annotation at the
            // time where the annotations touch.
            array_shift($secondFrames);
            array_shift($secondPoints);
            $first->frames = array_merge($firstFrames, $secondFrames);
            $first->points = array_merge($firstPoints, $secondPoints);
        } else {
            // Add a gap if the annotations do not touch.
            $first->frames = array_merge($firstFrames, [null], $secondFrames);
            if (!empty($firstPoints)) {
                // Don't do this for whole frame annotations without points.
                $first->points = array_merge($firstPoints, [[]], $secondPoints);
            }
        }

        DB::transaction(function () use ($first, $second) {
            $this->mergeAnnotationLabels($first, $second);
            $first->save();
            $second->delete();
        });

        $first->load('labels.label', 'labels.user');

        return $first;
    }

    /**
     * Update annotation labels of the second annotation to point to the first
     * annotation unless there already are equivalent annotation labels there.
     *
     * @param VideoAnnotation $first
     * @param VideoAnnotation $second
     */
    protected function mergeAnnotationLabels(VideoAnnotation $first, VideoAnnotation $second)
    {
        $firstLabels = $first->labels()->select('id', 'label_id', 'user_id')->get();
        $secondLabels = $second->labels()->select('id', 'label_id', 'user_id')->get();

        $secondLabels->each(function ($label) use ($first, $firstLabels) {
            foreach ($firstLabels as $compare) {
                if ($label->label_id === $compare->label_id
                    && $label->user_id === $compare->user_id) {
                    return;
                }
            }

            $label->update(['annotation_id' => $first->id]);
        });
    }
}
