<?php

namespace Biigle\Http\Controllers\Api\Annotations;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Generator;
use Symfony\Component\HttpFoundation\StreamedJsonResponse;

class VolumeAnnotationController extends Controller
{
    /**
     * Get all annotations of a volume.
     *
     * @api {get} volumes/:id/annotations Get all annotations
     * @apiGroup Volumes
     * @apiName VolumeIndexAnnotations
     * @apiPermission projectMember
     * @apiDescription This endpoint does not respect any active annotation sessions in the volume.
     *
     * @apiParam {Number} id The volume ID
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *        "id": 1,
     *        "image_id": 1,
     *        "shape_id": 4,
     *        "created_at": "2025-09-18T12:27:37.000000Z",
     *        "updated_at": "2025-09-18T12:27:37.000000Z",
     *        "points": [100, 200, 300],
     *        "labels": [
     *            {
     *                "id":321,
     *                "annotation_id":1,
     *                "label_id": 456,
     *                "user_id": 789,
     *                "confidence": 1
     *            }
     *        ]
     *    }
     * ]
     *
     * @param  int  $id
     * @return \Symfony\Component\HttpFoundation\StreamedJsonResponse
     */
    public function index($id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        if ($volume->isImageVolume()) {
            $query = ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
                ->select('image_annotations.*');
        } else {
            $query = VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
                ->select('video_annotations.*');
        }

        $query = $query->where('volume_id', $id)->with('labels');

        $generator = function () use ($query): Generator {
            foreach ($query->lazy() as $annotation) {
                yield $annotation;
            }
        };

        return new StreamedJsonResponse($generator());
    }
}
