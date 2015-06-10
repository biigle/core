<?php namespace Dias\Http\Controllers\Api;

use Dias\Project;

class ProjectAttributeController extends ModelWithAttributesController {
	
	/**
	 * {@inheritdoc}
	 */
	protected function getModel($id)
	{
		return Project::find($id);
	}

	// API DOC FOR INHERITED METHODS

	/**
	 * @api {get} projects/:id/attributes Get all attributes
	 * @apiGroup Projects
	 * @apiName IndexProjectAttributes
	 * @apiPermission projectMember
	 * @apiUse indexAttributes
	 */

	/**
	 * @api {get} projects/:id/attributes/:name Get an attribute
	 * @apiGroup Projects
	 * @apiName ShowProjectAttributes
	 * @apiPermission projectMember
	 * @apiUse showAttributes
	 */

	/**
	 * @api {post} projects/:id/attributes Attach an attribute
	 * @apiGroup Projects
	 * @apiName StoreProjectAttributes
	 * @apiPermission projectAdmin
	 * @apiUse storeAttributes
	 */

	/**
	 * @api {put} projects/:id/attributes/:name Update an attribute
	 * @apiGroup Projects
	 * @apiName UpdateProjectAttributes
	 * @apiPermission projectAdmin
	 * @apiUse updateAttributes
	 */

	/**
	 * @api {delete} projects/:id/attributes/:name Detach an attribute
	 * @apiGroup Projects
	 * @apiName DestroyProjectAttributes
	 * @apiPermission projectAdmin
	 * @apiUse destroyAttributes
	 */
}
