<?php

namespace Dias\Modules\Projects\Http\Controllers\Api;

use DB;
use Dias\Role;
use Dias\Project;
use Dias\Transect;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Api\Controller;

class AttachableTransectsController extends Controller
{
    /**
     * Shows all transects that can be attached to the project by the requesting user
     *
     * @api {get} projects/:id/attachable-transects Get all transects that can be attached
     * @apiGroup Projects
     * @apiName IndexAttachableTransects
     * @apiPermission admin
     * @apiParam {Number} id ID of the project for which the transects should be fetched.
     * @apiDescription A list of all transects where the requesting user has admin rights for (excluding those already belonging to the specified project).
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "My other transect",
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

        $transects = Transect::select('id', 'name')
            // All transects of other projects where the user has admin rights on.
            ->whereIn('id', function ($query) use ($auth, $id) {
                return $query->select('transect_id')
                    ->from('project_transect')
                    ->whereIn('project_id', function ($query) use ($auth, $id) {
                        return $query->select('project_id')
                            ->from('project_user')
                            ->where('user_id', $auth->user()->id)
                            ->where('project_role_id', Role::$admin->id)
                            ->where('project_id', '!=', $id);
                    });
            })
            // Do not return transects that are already attached to this project.
            // This is needed although we are already excluding the project in the
            // previous statement because other projects may already share transects with
            // this one.
            ->whereNotIn('id', function ($query) use ($id) {
                return $query->select('transect_id')
                    ->from('project_transect')
                    ->where('project_id', $id);
            })
            ->distinct()
            ->get();

        $transects->each(function ($item) {
            $item->append('thumbnail');
        });

        return $transects;
    }
}
