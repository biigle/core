<?php namespace Dias\Http\Controllers\Api;

use Dias\Transect;

class TransectAttributeController extends ModelWithAttributesController {
	
	/**
	 * {@inheritdoc}
	 */
	protected function getModel($id)
	{
		return Transect::find($id);
	}

	// API DOC FOR INHERITED METHODS

	/**
	 * @api {get} transects/:id/attributes Get all attributes
	 * @apiGroup Transects
	 * @apiName IndexTransectAttributes
	 * @apiPermission projectMember
	 * @apiUse indexAttributes
	 */

	/**
	 * @api {get} transects/:id/attributes/:name Get an attribute
	 * @apiGroup Transects
	 * @apiName ShowTransectAttributes
	 * @apiPermission projectMember
	 * @apiUse showAttributes
	 */

	/**
	 * @api {post} transects/:id/attributes Attach an attribute
	 * @apiGroup Transects
	 * @apiName StoreTransectAttributes
	 * @apiPermission projectEditor
	 * @apiUse storeAttributes
	 */

	/**
	 * @api {put} transects/:id/attributes/:name Update an attribute
	 * @apiGroup Transects
	 * @apiName UpdateTransectAttributes
	 * @apiPermission projectEditor
	 * @apiUse updateAttributes
	 */

	/**
	 * @api {delete} transects/:id/attributes/:name Detach an attribute
	 * @apiGroup Transects
	 * @apiName DestroyTransectAttributes
	 * @apiPermission projectEditor
	 * @apiUse destroyAttributes
	 */
}
