<?php

namespace Biigle\Modules\Projects\Http\Controllers\Api;

use Biigle\Role;
use Biigle\Project;
use Biigle\Volume;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Api\Controller;

class AttachableVolumesController extends Controller
{
    /**
     * Shows all volumes that can be attached to the project by the requesting user.
     *
     * @api {get} projects/:id/attachable-volumes Get all volumes that can be attached
     * @apiGroup Projects
     * @apiName IndexAttachableVolumes
     * @apiPermission admin
     * @apiParam {Number} id ID of the project for which the volumes should be fetched.
     * @apiDescription A list of all volumes where the requesting user has admin rights for (excluding those already belonging to the specified project).
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My other volume",
     *       "thumbnail": {
     *           "id": 12,
     *           "filename": "image.jpg",
     *           "uuid": "7ae57f55-6fd6-4857-a3ff-a3c9a099349b"
     *       }
     *    }
     * ]
     *
     * @param Guard $auth
     * @param id $id Project ID
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);

        $volumes = Volume::select('id', 'name')
            // All volumes of other projects where the user has admin rights on.
            ->whereIn('id', function ($query) use ($auth, $id) {
                return $query->select('volume_id')
                    ->from('project_volume')
                    ->whereIn('project_id', function ($query) use ($auth, $id) {
                        return $query->select('project_id')
                            ->from('project_user')
                            ->where('user_id', $auth->user()->id)
                            ->where('project_role_id', Role::$admin->id)
                            ->where('project_id', '!=', $id);
                    });
            })
            // Do not return volumes that are already attached to this project.
            // This is needed although we are already excluding the project in the
            // previous statement because other projects may already share volumes with
            // this one.
            ->whereNotIn('id', function ($query) use ($id) {
                return $query->select('volume_id')
                    ->from('project_volume')
                    ->where('project_id', $id);
            })
            ->distinct()
            ->get();

        $volumes->each(function ($item) {
            $item->append('thumbnail');
        });

        return $volumes;
    }
}
