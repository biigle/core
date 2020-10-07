<?php

namespace Biigle\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\ImageAnnotation;
use Biigle\Label;
use Biigle\MediaType;
use Biigle\Modules\Largo\Http\Requests\StoreProjectLargoSession;
use Biigle\Modules\Largo\Jobs\ApplyLargoSession;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Project;
use DB;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Ramsey\Uuid\Uuid;

class LargoController extends Controller
{
    /**
     * Save changes of an Largo session for a project.
     *
     * @api {post} projects/:id/largo Save a project session
     * @apiGroup Largo
     * @apiName ProjectsStoreLargo
     * @apiParam {Number} id The project ID.
     * @apiPermission projectEditor
     * @apiDescription See the 'Save a volume session' endpoint for more information
     *
     * @apiParam (Optional arguments) {Object} dismissed Map from a label ID to a list of IDs of image annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed Map from a label ID to a list of IDs of image annotations to which this label should be attached.
     * @apiParam (Optional arguments) {Object} force If set to `true`, project experts and admins can replace annotation labels attached by other users.
     *
     * @param StoreProjectLargoSession $request
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function save(StoreProjectLargoSession $request, $id)
    {
        if (count($request->dismissed) === 0 && count($request->changed) === 0) {
            return;
        }

        $uuid = Uuid::uuid4();
        $request->volumes->each(function ($volume) use ($uuid) {
            $attrs = $volume->attrs;
            $attrs['largo_job_id'] = $uuid;
            $volume->attrs = $attrs;
            $volume->save();
        });

        ApplyLargoSession::dispatch($uuid, $request->user(), $request->dismissed, $request->changed, $request->force);

        return ['id' => $uuid];
    }
}
