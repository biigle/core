<?php namespace Dias\Modules\Transects\Http\Controllers;

use Dias\Transect;
use Dias\Project;
use Dias\MediaType;
use Dias\Http\Controllers\Views\Controller;

use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;

class TransectController extends Controller {

	/**
	 * Shows the create transect page.
	 * 
	 * @return \Illuminate\Http\Response
	 */
	public function create()
	{
		$project = $this->requireNotNull(Project::find($this->request->input('project')));
		$this->requireCanEdit($project);

		return view('transects::create')
			->with('project', $project)
			->with('mediaTypes', MediaType::all());
	}

	/**
	 * Shows the transect index page.
	 * @param int $id transect ID
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		$transect = $this->requireNotNull(Transect::find($id));
		$this->requireCanSee($transect);

		return view('transects::index')
			->withTransect($transect)
			->withMixins($this->modules->getMixins('transects'))
			->withUser($this->user)
			->with('message', session('message'))
			->with('messageType', session('messageType'));
	}
}
