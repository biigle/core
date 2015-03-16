<?php namespace Dias\Http\Controllers\Views;

class HomeController extends Controller {

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return view('home');
	}

}
