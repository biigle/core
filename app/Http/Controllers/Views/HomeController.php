<?php namespace Dias\Http\Controllers\Views;

class HomeController extends Controller {

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return view('home')
			->withMixins($this->modules->getMixins('dashboard'))
			->with('message', session('message'))
			->with('messageType', session('messageType'));
	}

}
