<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\ApiController;
use Dias\Transect;

class TransectController extends ApiController {

	/**
	 * Displays the specified transect.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function show($id)
	{
		$transect = $this->requireNotNull(Transect::find($id));
		$this->requireCanSee($transect);
		return $transect;
	}

	/**
	 * Updates the attributes of the specified transect.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function update($id)
	{
		$transect = $this->requireNotNull(Transect::find($id));
		$this->requireCanEdit($transect);
		$transect->name = $this->request->input('name', $transect->name);
		$transect->save();
	}
}
