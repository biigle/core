<?php namespace Dias\Http\Controllers\Api;

use Dias\Transect;

class TransectImageController extends Controller {

	/**
	 * List the image IDs of the specified transect.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function index($id)
	{
		$transect = $this->requireNotNull(Transect::find($id));
		$this->requireCanSee($transect);
		return $transect->images()->lists('id');
	}
}
