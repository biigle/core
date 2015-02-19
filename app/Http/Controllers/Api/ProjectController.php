<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\ApiController;

use Dias\Project;

class ProjectController extends ApiController {

	/**
	 * Shows all projects the requesting user belongs to.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return $this->auth->user()->projects;
	}

	/**
	 * Displays the specified project.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function show($id)
	{
		$project = $this->requireNotNull(Project::find($id));
		$this->requireCanSee($project);
		
		return $project;
	}

	/**
	 * Updates the attributes of the specified project.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function update($id)
	{
		$project = $this->requireNotNull(Project::find($id));
		$this->requireCanAdmin($project);
		
		$project->name = $this->request->input('name', $project->name);
		$project->description = $this->request->input('description', $project->description);
		$project->save();

		return response('Ok.', 200);
	}

	/**
	 * Creates a new project.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function store()
	{
		$this->requireArguments('name', 'description');

		$project = new Project;
		$project->name = $this->request->input('name');
		$project->description = $this->request->input('description');
		$project->setCreator($this->auth->user());
		$project->save();
		return $project->fresh();
	}

	/**
	 * Removes the specified project.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function destroy($id)
	{

		$project = $this->requireNotNull(Project::find($id));
		$this->requireCanAdmin($project);

		$project->delete();
		return response('Deleted.', 200);
	}

}
