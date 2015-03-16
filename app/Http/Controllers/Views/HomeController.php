<?php namespace Dias\Http\Controllers\Views;

use Dias\Services\Modules;

class HomeController extends Controller {

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index(Modules $modules)
	{
		return view('home')
			->withMixins($modules->getMixins('dashboard'));
	}

}
