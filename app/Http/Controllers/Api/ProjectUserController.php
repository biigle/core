<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\AttachProjectUser;
use Biigle\Http\Requests\DestroyProjectUser;
use Biigle\Http\Requests\UpdateProjectUser;
use Biigle\Project;

class ProjectUserController extends Controller
{
    /**
     * Displays the users belonging to the specified project.
     *
     * @api {get} projects/:id/users Get all members
     * @apiGroup Projects
     * @apiName IndexProjectUsers
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "firstname": "Joe",
     *       "firstname": "User",
     *       "project_role_id": 1
     *    },
     *    {
     *       "id": 2,
     *       "firstname": "Jane",
     *       "firstname": "User",
     *       "project_role_id": 2
     *    }
     * ]
     *
     * @param int $id
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        return $project->users()->select('id', 'firstname', 'lastname')->get();
    }

    /**
     * Updates the attributes of the specified user in the specified project.
     *
     * @api {put} projects/:pid/users/:uid Update a member
     * @apiGroup Projects
     * @apiName UpdateProjectUsers
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} pid The project ID.
     * @apiParam {Number} uid The user ID of the project member.
     *
     * @apiParam (Attributes that can be updated) {Number} project_role_id The project role of the member. Users with the global guest role cannot become project admins.
     *
     * @param UpdateProjectUser $request
     */
    public function update(UpdateProjectUser $request)
    {
        $request->project->changeRole($request->user->id, $request->input('project_role_id'));
    }

    /**
     * Adds a new user to the specified project.
     *
     * @api {post} projects/:pid/users/:uid Add a new member
     * @apiGroup Projects
     * @apiName AttachProjectUsers
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} pid The project ID.
     * @apiParam {Number} uid The user ID of the new member.
     *
     * @apiParam (Required attributes) {Number} project_role_id The project role of the member.
     *
     * @apiParamExample {String} Request example:
     * project_role_id: 3
     *
     * @param AttachProjectUser $request
     */
    public function attach(AttachProjectUser $request)
    {
        $request->project->addUserId($request->user->id, $request->input('project_role_id'));
    }

    /**
     * Removes a user form the specified project.
     *
     * @api {delete} projects/:pid/users/:uid Remove a member
     * @apiGroup Projects
     * @apiName DestroyProjectUsers
     * @apiPermission projectMember
     * @apiDescription A project member can remove themselves. Only a project admin can remove members other than themselves.
     *
     * **The only remaining admin of a project is not allowed to remove themselves.** The admin role should be passed over to another project user or the project should be deleted.
     *
     * @apiParam {Number} pid The project ID.
     * @apiParam {Number} uid The user ID of the member.
     *
     * @param DestroyProjectUser $request
     */
    public function destroy(DestroyProjectUser $request)
    {
        $request->project->removeUserId($request->user->id);
    }
}
