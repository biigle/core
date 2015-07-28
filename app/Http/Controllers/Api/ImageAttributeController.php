<?php

namespace Dias\Http\Controllers\Api;

use Dias\Image;

class ImageAttributeController extends ModelWithAttributesController
{
    /**
     * {@inheritdoc}
     */
    protected function getModel($id)
    {
        return Image::find($id);
    }

    // API DOC FOR INHERITED METHODS

    /*
     * @api {get} images/:id/attributes Get all attributes
     * @apiGroup Images
     * @apiName IndexImageAttributes
     * @apiPermission projectMember
     * @apiUse indexAttributes
     */

    /*
     * @api {get} images/:id/attributes/:name Get an attribute
     * @apiGroup Images
     * @apiName ShowImageAttributes
     * @apiPermission projectMember
     * @apiUse showAttributes
     */

    /*
     * @api {post} images/:id/attributes Attach an attribute
     * @apiGroup Images
     * @apiName StoreImageAttributes
     * @apiPermission projectEditor
     * @apiUse storeAttributes
     */

    /*
     * @api {put} images/:id/attributes/:name Update an attribute
     * @apiGroup Images
     * @apiName UpdateImageAttributes
     * @apiPermission projectEditor
     * @apiUse updateAttributes
     */

    /*
     * @api {delete} images/:id/attributes/:name Detach an attribute
     * @apiGroup Images
     * @apiName DestroyImageAttributes
     * @apiPermission projectEditor
     * @apiUse destroyAttributes
     */
}
