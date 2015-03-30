<?php namespace Dias\Modules\Annotations\Http\Controllers;

// use Dias\Transect;
// use Dias\Project;
// use Dias\MediaType;
use Dias\Http\Controllers\Views\Controller;

class AnnotationController extends Controller {

	/**
	 * Shows the annotation index page.
	 * @param int $id image ID
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		// $transect = $this->requireNotNull(Transect::find($id));
		// $this->requireCanSee($transect);

		// return view('transects::index')
		// 	->withTransect($transect)
		// 	->withMixins($this->modules->getMixins('transects'))
		// 	->with('message', session('message'))
		// 	->with('messageType', session('messageType'));
	}
}
