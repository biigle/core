<?php

namespace Biigle\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreVolumeLargoSession;
use Biigle\Jobs\ApplyLargoSession;
use Illuminate\Http\Request;
use Ramsey\Uuid\Uuid;

class LargoController extends Controller
{
    /**
     * Save changes of an Largo session for a volume.
     *
     * @api {post} volumes/:id/largo Save a volume session
     * @apiGroup Largo
     * @apiName VolumesStoreLargo
     * @apiParam {Number} id The volume ID.
     * @apiPermission projectEditor
     * @apiDescription From the `dismissed` map only annotation labels that were attached by the requesting user will be detached (unless `force` is set to `true`). If the map contains annotation labels that were not attached by the user, the information will be ignored. From the `changed` map, new annotation labels will be created. If, after detaching `dismissed` annotation labels and attaching `changed` annotation labels, there is an annotation whithout any label, the annotation will be deleted. All affected annotations must belong to the same volume.
     *
     * @apiParam (Optional arguments) {Object} dismissed_image_annotations Map from a label ID to a list of IDs of image annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed_image_annotations Map from a label ID to a list of IDs of image annotations to which this label should be attached.
     * @apiParam (Optional arguments) {Object} dismissed_video_annotations Map from a label ID to a list of IDs of video annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed_video_annotations Map from a label ID to a list of IDs of video annotations to which this label should be attached.
     * @apiParam (Optional arguments) {Object} force If set to `true`, project experts and admins can replace annotation labels attached by other users.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * {
     *    dismissed_image_annotations: {
     *       12: [1, 2, 3, 4],
     *       24: [15, 2, 10]
     *    },
     *    changed_image_annotations: {
     *       5: [1, 3],
     *       13: [10],
     *    }
     * }
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": "b02d5d09-df21-4385-9f1a-c3c7d5095e13"
     * }
     *
     * @param StoreVolumeLargoSession $request
     * @return \Illuminate\Http\Response
     */
    public function save(StoreVolumeLargoSession $request)
    {
        if ($request->emptyRequest) {
            return;
        }

        $uuid = Uuid::uuid4();
        // Set job ID in volume to lock it for any other Largo sessions to save while
        // this session is saved.
        $attrs = $request->volume->attrs;
        $attrs['largo_job_id'] = $uuid;
        $request->volume->attrs = $attrs;
        $request->volume->save();

        ApplyLargoSession::dispatch($uuid, $request->user(), $request->dismissedImageAnnotations, $request->changedImageAnnotations, $request->dismissedVideoAnnotations, $request->changedVideoAnnotations, $request->force);

        return ['id' => $uuid];
    }
}
