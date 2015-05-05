<?php namespace Dias\Http\Controllers\Views;

class DocController extends Controller {

	/**
	 * Show the application documentation center to the user.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return view('documentation')
			->withMixins($this->modules->getMixins('documentation'))
			->with('message', session('message'))
			->with('messageType', session('messageType'));
	}
}
