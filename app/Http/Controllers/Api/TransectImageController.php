<?php namespace Dias\Http\Controllers\Api;

use Dias\Transect;

class TransectImageController extends Controller {

	/**
	 * List the image IDs of the specified transect.
	 * 
	 * @api {get} transects/:id/images Get all images
	 * @apiGroup Transects
	 * @apiName IndexTransectImages
	 * @apiPermission projectMember
	 * @apiDescription Returns a list of all image IDs of the transect.
	 * 
	 * @apiParam {Number} id The transect ID.
	 * 
	 * @apiSuccessExample {json} Success response:
	 * [1, 2, 3, 4, 5, 6]
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
