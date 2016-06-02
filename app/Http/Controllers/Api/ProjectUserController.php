<?php

namespace Dias\Http\Controllers\Api;

use Dias\Project;
use Dias\User;
use Dias\Role;

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
     * @param int $projectId
     * @return \Illuminate\Http\Response
     */
    public function index($projectId)
    {
        $project = Project::findOrFail($projectId);
        $this->requireCanSee($project);

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
     * @apiParam (Attributes that can be updated) {Number} project_role_id The project role of the member.
     *
     * @param  int  $projectId
     * @param  int  $userId
     * @return \Illuminate\Http\Response
     */
    public function update($projectId, $userId)
    {
        $project = Project::findOrFail($projectId);
        $this->requireCanAdmin($project);

        $role = Role::find($this->request->input('project_role_id'));

        if (!$role) {
            abort(400, 'Role does not exist.');
        }

        $project->changeRole($userId, $role->id);

        return response('Ok.', 200);
    }

    /**
     * Adds a new user to the specified project.
     *
     * @api {post} projects/:pid/transects/:uid Add a new member
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
     * @param int $projectId
     * @param int $userId
     * @return \Illuminate\Http\Response
     */
    public function attach($projectId, $userId)
    {
        $project = Project::findOrFail($projectId);
        $this->requireCanAdmin($project);

        $user = User::find($userId);
        $role = Role::find($this->request->input('project_role_id'));

        if (!$user || !$role) {
            abort(400, 'Bad arguments.');
        }

        $project->addUserId($user->id, $role->id);

        return response('Ok.', 200);
    }

    /**
     * Removes a user form the specified project.
     *
     * @api {delete} projects/:pid/transects/:uid Remove a member
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
     * @param  int  $projectId
     * @param  int  $userId
     * @return \Illuminate\Http\Response
     */
    public function destroy($projectId, $userId)
    {
        $project = Project::findOrFail($projectId);

        // the user is only allowed to do this if they are admin or want to
        // remove themselves
        if ($this->user->canAdminOneOfProjects([$projectId]) || $this->user->id == $userId) {
            $project->removeUserId($userId);

            return response('Ok.', 200);
        }

        abort(401);
    }
}
