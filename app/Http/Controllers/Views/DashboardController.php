<?php namespace Dias\Http\Controllers\Views;

class DashboardController extends Controller {

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return view('dashboard')
			->withMixins($this->modules->getMixins('dashboard'))
			->with('message', session('message'))
			->with('messageType', session('messageType'));
	}

}
