<?php namespace Dias\Http\Controllers\Views;

class SettingsController extends Controller {

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return view('settings')
			->withUser($this->user)
			->with('message', session('message'))
			->with('messageType', session('messageType'));
	}

}
