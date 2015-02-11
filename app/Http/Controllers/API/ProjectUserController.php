<?php namespace Dias\Http\Controllers\API;

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
			return response('Unauthorized.', 401);
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
		// TODO move more logic into the model ( $project->updateUserBy() )

		$project = Project::find($projectId);
		if (!$project || !$project->hasAdmin($this->auth->user()))
		{
			return response('Unauthorized.', 401);
		}

		if (!$request->has('role_id'))
		{
			return response("Missing arguments.", 400);
		}

		if (!$project->hasUserId($userId))
		{
			return response("User doesn't exist in this project.", 400);
		}

		$role = Role::find($request->input('role_id'));

		if (!$role)
		{
			return response("Role does not exist.", 400);
		}

		if ($project->users()->detach($userId))
		{
			// only re-attach if detach was successful
			$project->users()->attach($userId, array('role_id' => $role->id));
			return response("Ok.", 200);
		}
		else
		{
			return response("The user couldn't be modified.", 500);
		}
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
		// TODO move more logic into the model ( $project->storeUserBy() )

		$project = Project::find($projectId);
		if (!$project || !$project->hasAdmin($this->auth->user()))
		{
			return response('Unauthorized.', 401);
		}

		if (!$request->has('id', 'role_id'))
		{
			return response("Missing arguments.", 400);
		}

		$user = User::find($request->input('id'));
		$role = Role::find($request->input('role_id'));

		if (!$user || !$role)
		{
			return response("Bad arguments.", 400);
		}

		$project->users()->attach($user->id, array('role_id' => $role->id));
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
		// TODO move more logic into the model ( $project->destroyUserBy() )

		$project = Project::find($projectId);
		$user = $this->auth->user();

		// the user is only allowed to do this if they are admin or want to
		// remove themselves
		if ($project && ($project->hasAdmin($user) || $user->id == $userId))
		{
			$admins = $project->admins();
			// the last remaining admin cannot be deleted
			if ($admins->count() == 1 && $admins->find($userId))
			{
				return response("The last project admin cannot be deleted.", 400);
			}

			$project->users()->detach($userId);
			return response("Ok.", 200);
		}
		
		return response('Unauthorized.', 401);
	}

}
