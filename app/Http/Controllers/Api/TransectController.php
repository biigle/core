<?php namespace Dias\Http\Controllers\Api;

use Dias\Transect;

class TransectController extends Controller {

	/**
	 * Displays the specified transect.
	 *
	 * @param  int  $id
	 * @return Transect
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
