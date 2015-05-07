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

	/**
	 * Show the package development tutorial
	 *	
	 * @param string $name Article name
	 * @return \Illuminate\Http\Response
	 */
	public function article($name)
	{
		if (view()->exists('documentation.'.$name))
		{
			return view('documentation.'.$name);
		}
		else
		{
			abort(404);
		}
	}
}
