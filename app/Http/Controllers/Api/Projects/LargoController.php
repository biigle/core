<?php

namespace Biigle\Http\Controllers\Api\Projects;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Http\Requests\StoreProjectLargoSession;
use Biigle\Jobs\ApplyLargoSession;
use Biigle\Label;
use Biigle\Project;
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
     * @apiParam (Optional arguments) {Object} dismissed_image_annotations Map from a label ID to a list of IDs of image annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed_image_annotations Map from a label ID to a list of IDs of image annotations to which this label should be attached.
     * @apiParam (Optional arguments) {Object} dismissed_video_annotations Map from a label ID to a list of IDs of video annotations from which this label should be detached.
     * @apiParam (Optional arguments) {Object} changed_video_annotations Map from a label ID to a list of IDs of video annotations to which this label should be attached.
     * @apiParam (Optional arguments) {Object} force If set to `true`, project experts and admins can replace annotation labels attached by other users.
     *
     * @param StoreProjectLargoSession $request
     * @param int $id Project ID
     * @return array|void
     */
    public function save(StoreProjectLargoSession $request, $id)
    {
        if ($request->emptyRequest) {
            return;
        }

        $uuid = Uuid::uuid4();
        // Set job ID in volumes to lock them for any other Largo sessions to save while
        // this session is saved.
        $request->volumes->each(function ($volume) use ($uuid) {
            $attrs = $volume->attrs;
            $attrs['largo_job_id'] = $uuid;
            $volume->attrs = $attrs;
            $volume->save();
        });

        ApplyLargoSession::dispatch($uuid, $request->user(), $request->dismissedImageAnnotations, $request->changedImageAnnotations, $request->dismissedVideoAnnotations, $request->changedVideoAnnotations, $request->force);

        return ['id' => $uuid];
    }
}
