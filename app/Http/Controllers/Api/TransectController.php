<?php namespace Dias\Http\Controllers\Api;

use Dias\Transect;

class TransectController extends Controller {

	/**
	 * Displays the specified transect.
	 * 
	 * @api {get} transects/:id Get a transect
	 * @apiGroup Transects
	 * @apiName ShowTransects
	 * @apiPermission projectMember
	 * 
	 * @apiParam {Number} id The transect ID.
	 *
	 * @apiSuccessExample {json} Success response:
	 * {
	 *    "id": 1,
	 *    "name": "transect 1",
	 *    "media_type_id": 3,
	 *    "creator_id": 7,
	 *    "created_at": "2015-02-20 17:51:03",
	 *    "updated_at": "2015-02-20 17:51:03",
	 *    "url": "/vol/images/"
	 * }
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
	 * @api {put} transects/:id Update a transect
	 * @apiGroup Transects
	 * @apiName UpdateTransects
	 * @apiPermission projectAdmin
	 * 
	 * @apiParam {Number} id The transect ID.
	 * 
	 * @apiParam (Attributes that can be updated) {String} name Name of the transect.
	 *
	 * @param  int  $id
	 * @return \Illuminate\Http\Response
	 */
	public function update($id)
	{
		$transect = $this->requireNotNull(Transect::find($id));
		$this->requireCanAdmin($transect);
		$transect->name = $this->request->input('name', $transect->name);
		$transect->save();
	}
}
