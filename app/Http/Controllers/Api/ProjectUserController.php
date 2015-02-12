<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

use Dias\Project;
use Dias\User;
use Dias\Role;

class ProjectUserController extends Controller {

	private $auth;

	public function __construct(Guard $auth)
	{
		$this->middleware('auth.api');
		$this->auth = $auth;
	}

	/**
	 * Displays the users belonging to the specified project.
	 *
	 * @param int $projectId
	 * @return Response
	 */
	public function index($projectId)
	{
		$project = Project::find($projectId);
		if (!$project || !$project->hasUser($this->auth->user()))
		{
			abort(401);
		}
		return $project->users()->get();
	}

	/**
	 * Updates the attributes of the specified user in the specified project.
	 *
	 * @param  int  $projectId
	 * @param  int  $userId
	 * @param  Illuminate\Http\Request $request
	 * @return Response
	 */
	public function update($projectId, $userId, Request $request)
	{
		$project = Project::find($projectId);
		if (!$project || !$project->hasAdmin($this->auth->user()))
		{
			abort(401);
		}

		$role = Role::find($request->input('role_id'));

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
	 * @param Illuminate\Http\Request $request
	 * @return Response
	 */
	public function store($projectId, Request $request)
	{
		$project = Project::find($projectId);
		if (!$project || !$project->hasAdmin($this->auth->user()))
		{
			abort(401);
		}

		$user = User::find($request->input('id'));
		$role = Role::find($request->input('role_id'));

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
	 * @return Response
	 */
	public function destroy($projectId, $userId)
	{
		$project = Project::find($projectId);
		$user = $this->auth->user();

		// the user is only allowed to do this if they are admin or want to
		// remove themselves
		if ($project && ($project->hasAdmin($user) || $user->id == $userId))
		{
			$project->removeUserId($userId);
			return response("Ok.", 200);
		}
		
		return abort(401);
	}

}
