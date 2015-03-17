<?php namespace Dias\Modules\Projects\Http\Controllers;

use Dias\Project;
use Dias\Http\Controllers\Views\Controller;

class ProjectController extends Controller {

	public function create()
	{
		return view('projects::create');
	}

	/**
	 * Shows the project index page.
	 * @param int $id project ID
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		$project = $this->requireNotNull(Project::find($id));
		$this->requireCanSee($project);

		return view('projects::index')
			->withProject($project)
			->withMixins($this->modules->getMixins('projects'))
			->withUser($this->user)
			->with('message', session('message'))
			->with('messageType', session('messageType'));
	}
}
