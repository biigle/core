<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\ApiController;
use Dias\Transect;

class TransectImageController extends ApiController {

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
