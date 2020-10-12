<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\Label;
use Biigle\Modules\Largo\Http\Requests\StoreVolumeLargoSession;
use Biigle\Modules\Largo\Jobs\ApplyLargoSession;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Project;
use Biigle\Role;
use Biigle\Volume;
use DB;
use Illuminate\Auth\Access\AuthorizationException;
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
     * @apiDescription From the `dismissed` map only image annotation labels that were attached by the requesting user will be detached (unless `force` is set to `true`). If the map contains image annotation labels that were not attached by the user, the information will be ignored. From the `changed` map, new image annotation labels will be created. If, after detaching `dismissed` image annotation labels and attaching `changed` image annotation labels, there is an image annotation whithout any label, the annotation will be deleted. All affected image annotations must belong to the same volume. If the user is not allowed to edit in this volume, the whole request will be denied. Only available for image volumes.
     *
     * @apiParam (Optional arguments) {Object} dismissed Map from a label ID to a list of IDs of annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed Map from a label ID to a list of IDs of annotations to which this label should be attached.
     * @apiParam (Optional arguments) {Object} force If set to `true`, project experts and admins can replace annotation labels attached by other users.
     *
     * @apiParamExample {JSON} Request example (JSON):
     * {
     *    dismissed: {
     *       12: [1, 2, 3, 4],
     *       24: [15, 2, 10]
     *    },
     *    changed: {
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
        if (count($request->dismissed) === 0 && count($request->changed) === 0) {
            return;
        }

        $uuid = Uuid::uuid4();
        $attrs = $request->volume->attrs;
        $attrs['largo_job_id'] = $uuid;
        $request->volume->attrs = $attrs;
        $request->volume->save();

        ApplyLargoSession::dispatch($uuid, $request->user(), $request->dismissed, $request->changed, $request->force);

        return ['id' => $uuid];
    }
}
