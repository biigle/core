<?php

namespace Biigle\Http\Controllers\Api;

use Exception;
use Biigle\Volume;
use Biigle\Project;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;

class ProjectVolumeController extends Controller
{
    /**
     * Shows a list of all volumes belonging to the specified project..
     *
     * @api {get} projects/:id/volumes Get all volumes
     * @apiGroup Projects
     * @apiName IndexProjectVolumes
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "volume 1",
     *       "media_type_id": 3,
     *       "creator_id": 7,
     *       "created_at": "2015-02-19 14:45:58",
     *       "updated_at":"2015-02-19 14:45:58",
     *       "url": "/vol/volumes/1"
     *    }
     * ]
     *
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        return $project->volumes;
    }

    /**
     * Attaches the existing specified volume to the existing specified
     * project.
     *
     * @api {post} projects/:pid/volumes/:vid Attach a volume
     * @apiGroup Projects
     * @apiName AttachProjectVolumes
     * @apiPermission projectAdmin
     * @apiDescription This endpoint attaches an existing volume to another existing project. The volume then will belong to multiple projects. The user performing this operation needs to be project admin in both the project, the volume initially belongs to, and the project, the volume should be attached to.
     *
     * @apiParam {Number} pid ID of the project that should get the annotation.
     * @apiParam {Number} vid ID of the existing volume to attach to the project.
     *
     * @param Request $request
     * @param int $projectId
     * @param int $volumeId
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $projectId, $volumeId)
    {
        // user must be able to admin the volume *and* the project it should
        // be attached to
        $volume = Volume::findOrFail($volumeId);
        $this->authorize('update', $volume);
        $project = Project::findOrFail($projectId);
        $this->authorize('update', $project);

        if ($project->volumes()->where('volumes.id', $volumeId)->exists()) {
            return $this->buildFailedValidationResponse($request, [
                'vid' => 'The volume is already attached to the project.',
            ]);
        }

        $project->volumes()->attach($volume);
    }

    /**
     * Detaches the specified volume from the specified project. If this would delete
     * annotations or image labels, the `force` parameter is required.
     *
     * @api {delete} projects/:pid/volumes/:vid Detach a volume
     * @apiGroup Projects
     * @apiName DestroyProjectVolumes
     * @apiPermission projectAdmin
     * @apiDescription Detaches a volume from a project. This will delete any
     * annotations or image labels that were created in the project and volume. If there
     * are annotations or image labels to be deleted, the `force` parameter is required.
     *
     * @apiParam {Number} pid ID of the project, from which the volume should be
     * detached.
     * @apiParam {Number} vid The volume ID.
     *
     * @apiParam (Optional parameters) {Boolean} force Set this parameter if the request
     * should delete annotations or image labels. Else the request will be rejected.
     *
     * @param Request $request
     * @param  int  $projectId
     * @param  int  $volumeId
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $projectId, $volumeId)
    {
        $project = Project::findOrFail($projectId);
        $this->authorize('update', $project);
        $volume = $project->volumes()->findOrFail($volumeId);
        $project->detachVolume($volume, $request->has('force'));
    }
}
