<?php

namespace Dias\Http\Controllers\Api;

use Dias\Annotation;

class AnnotationAttributeController extends ModelWithAttributesController
{
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

    /**
     * @api {post} annotations/:id/attributes Attach an attribute
     * @apiGroup Annotations
     * @apiName StoreAnnotationAttributes
     * @apiPermission projectEditor
     * @apiUse storeAttributes
     */

    /**
     * @api {put} annotations/:id/attributes/:name Update an attribute
     * @apiGroup Annotations
     * @apiName UpdateAnnotationAttributes
     * @apiPermission projectEditor
     * @apiUse updateAttributes
     */

    /**
     * @api {delete} annotations/:id/attributes/:name Detach an attribute
     * @apiGroup Annotations
     * @apiName DestroyAnnotationAttributes
     * @apiPermission projectEditor
     * @apiUse destroyAttributes
     */
}
