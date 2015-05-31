<?php namespace Dias\Http\Controllers\Api;

use Dias\Annotation;

class AnnotationAttributeController extends ModelWithAttributesController {
	
	/**
	 * {@inheritdoc}
	 */
	protected function getModel($id)
	{
		return Annotation::find($id);
	}

	// API DOC FOR INHERITED METHODS

	/**
	 * @api {get} annotations/:id/attributes Get all attributes
	 * @apiGroup Annotations
	 * @apiName IndexAnnotationAttributes
	 * @apiPermission projectMember
	 * @apiUse indexAttributes
	 */

	/**
	 * @api {get} annotations/:id/attributes/:name Get an attribute
	 * @apiGroup Annotations
	 * @apiName ShowAnnotationAttributes
	 * @apiPermission projectMember
	 * @apiUse showAttributes
	 */
}
