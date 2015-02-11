<?php namespace Dias\Http\Controllers\API;

use Dias\Http\Controllers\Controller;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

use Dias\Project;

class ProjectController extends Controller {

	public function __construct()
	{
		$this->middleware('auth.api');
	}

	/**
	 * Display a listing of the resource.
	 *
	 * @param  Illuminate\Contracts\Auth\Guard $auth
	 * @return Response
	 */
	public function index(Guard $auth)
	{
		return $auth->user()->projects;
	}

	/**
	 * Display the specified resource.
	 *
	 * @param  int  $id
	 * @param  Illuminate\Contracts\Auth\Guard $auth
	 * @return Response
	 */
	public function show($id, Guard $auth)
	{
		$project = Project::find($id);
		if ($project && $project->hasUser($auth->user()))
		{
			return $project;
		}
		
		return response('Unauthorized.', 401);
	}

	/**
	 * Update the specified resource in storage.
	 *
	 * @param  int  $id
	 * @param  Illuminate\Contracts\Auth\Guard $auth
	 * @param  Illuminate\Http\Request $request
	 * @return Response
	 */
	public function update($id, Guard $auth, Request $request)
	{
		$project = Project::find($id);
		if ($project && $project->userHasRole($auth->user(), 'admin'))
		{
			$project->name = $request->input('name', $project->name);
			$project->description = $request->input('description', $project->description);
			$project->save();

			return response('Ok.', 200);
		}
		
		return response('Unauthorized.', 401);
	}

	/**
	 * Store a newly created resource in storage.
	 *
	 * @param  Illuminate\Http\Request $request
	 * @param  Illuminate\Contracts\Auth\Guard $auth
	 * @return Response
	 */
	public function store(Guard $auth, Request $request)
	{
		if ($request->has('name', 'description'))
		{
			$project = new Project;
			$project->name = $request->input('name');
			$project->description = $request->input('description');
			$project->creator()->associate($auth->user());
			$project->save();
			// makes sure the project was successfully stored
			// and doesn't contain additional information like the creator object
			return Project::find($project->id);
		}

		return response('Bad request. No content.', 400);
	}

	/**
	 * Remove the specified resource from storage.
	 *
	 * @param  int  $id
	 * @param  Illuminate\Contracts\Auth\Guard $auth
	 * @return Response
	 */
	public function destroy($id, Guard $auth)
	{
		$project = Project::find($id);
		if (!$project)
		{
			return response('Not Found.', 404);
		} else if ($project->userHasRole($auth->user(), 'admin'))
		{
			$project->delete();
			return response('Deleted.', 200);
		}
		return response('Unauthorized.', 401);
	}

}
