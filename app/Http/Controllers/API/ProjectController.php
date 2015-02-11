<?php namespace Dias\Http\Controllers\API;

use Dias\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

use Dias\Project;

class ProjectController extends Controller {

	private $auth;

	public function __construct(Guard $auth)
	{
		$this->middleware('auth.api');
		$this->auth = $auth;
	}

	/**
	 * Schows all projects the requesting user belongs to.
	 *
	 * @return Response
	 */
	public function index()
	{
		return $this->auth->user()->projects;
	}

	/**
	 * Displays the specified project.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($id)
	{
		$project = Project::find($id);
		if (!$project || !$project->hasUser($this->auth->user()))
		{
			return response('Unauthorized.', 401);
		}
		
		return $project;
	}

	/**
	 * Updates the attributes of the specified project.
	 *
	 * @param  int  $id
	 * @param  Illuminate\Http\Request $request
	 * @return Response
	 */
	public function update($id, Request $request)
	{
		$project = Project::find($id);
		if (!$project || !$project->hasAdmin($this->auth->user()))
		{
			return response('Unauthorized.', 401);
		}
		
		$project->name = $request->input('name', $project->name);
		$project->description = $request->input('description', $project->description);
		$project->save();

		return response('Ok.', 200);
	}

	/**
	 * Creates a new project.
	 *
	 * @param  Illuminate\Http\Request $request
	 * @return Response
	 */
	public function store(Request $request)
	{
		if (!$request->has('name', 'description'))
		{
			return response('Bad arguments.', 400);
		}
		
		$project = new Project;
		$project->name = $request->input('name');
		$project->description = $request->input('description');
		$project->setCreator($this->auth->user());
		$project->save();
		// makes sure the project was successfully stored
		// and doesn't contain additional information like the creator object
		return Project::find($project->id);
	}

	/**
	 * Removes the specified project.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function destroy($id)
	{
		// TODO move more logic into the model ( $project->deleteBy() )

		$project = Project::find($id);
		if (!$project)
		{
			return response('Not Found.', 404);
		}

		if (!$project->hasAdmin($this->auth->user()))
		{
			return response('Unauthorized.', 401);
		}

		$project->delete();
		return response('Deleted.', 200);
	}

}
