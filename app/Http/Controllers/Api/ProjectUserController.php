<?php namespace Dias\Http\Controllers\Api;

use Dias\Project;
use Dias\User;
use Dias\Role;

class ProjectUserController extends Controller {

	/**
	 * Displays the users belonging to the specified project.
	 *
	 * @param int $projectId
	 * @return \Illuminate\Http\Response
	 */
	public function index($projectId)
	{
		$project = $this->requireNotNull(Project::find($projectId));
		$this->requireCanSee($project);
		return $project->users;
	}

	/**
	 * Updates the attributes of the specified user in the specified project.
	 *
	 * @param  int  $projectId
	 * @param  int  $userId
	 * @return \Illuminate\Http\Response
	 */
	public function update($projectId, $userId)
	{
		$project = $this->requireNotNull(Project::find($projectId));
		$this->requireCanAdmin($project);

		$role = Role::find($this->request->input('project_role_id'));

		if (!$role)
		{
			abort(400, "Role does not exist.");
		}

		$project->changeRole($userId, $role->id);
		return response("Ok.", 200);
	}

	/**
	 * Adds a new user to the specified project.
	 *
	 * @param int $projectId
	 * @param int $userId
	 * @return \Illuminate\Http\Response
	 */
	public function attach($projectId, $userId)
	{
		$project = $this->requireNotNull(Project::find($projectId));
		$this->requireCanAdmin($project);

		$user = User::find($userId);
		$role = Role::find($this->request->input('project_role_id'));

		if (!$user || !$role)
		{
			abort(400, "Bad arguments.");
		}

		$project->addUserId($user->id, $role->id);

		return response("Ok.", 200);
	}

	/**
	 * Removes a user form the specified project.
	 *
	 * @param  int  $projectId
	 * @param  int  $userId
	 * @return \Illuminate\Http\Response
	 */
	public function destroy($projectId, $userId)
	{
		$project = $this->requireNotNull(Project::find($projectId));
		$user = $this->user;

		// the user is only allowed to do this if they are admin or want to
		// remove themselves
		if ($project->hasAdmin($user) || $user->id == $userId)
		{
			$project->removeUserId($userId);
			return response("Ok.", 200);
		}
		
		return abort(401);
	}

}
