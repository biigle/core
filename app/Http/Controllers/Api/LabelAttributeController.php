<?php

namespace Dias\Http\Controllers\Api;

use Dias\Label;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

class LabelAttributeController extends ModelWithAttributesController
{
    /**
     * Creates a new LabelAttributeController instance.
     *
     * @param Request $request
     */
    public function __construct(Request $request)
    {
        parent::__construct($request);
        $this->middleware('admin', ['except' => ['index', 'show']]);
    }

    /**
     * {@inheritdoc}
     */
    protected function getModel($id)
    {
        return Label::find($id);
    }

    // API DOC FOR INHERITED METHODS

    /*
     * @api {get} labels/:id/attributes Get all attributes
     * @apiGroup Labels
     * @apiName IndexLabelAttributes
     * @apiUse indexAttributes
     * @apiPermission user
     */

    /*
     * @api {get} labels/:id/attributes/:name Get an attribute
     * @apiGroup Labels
     * @apiName ShowLabelAttributes
     * @apiUse showAttributes
     * @apiPermission user
     */

    /*
     * @api {post} labels/:id/attributes Attach an attribute
     * @apiGroup Labels
     * @apiName StoreLabelAttributes
     * @apiPermission admin
     * @apiUse storeAttributes
     */

    /*
     * @api {put} labels/:id/attributes/:name Update an attribute
     * @apiGroup Labels
     * @apiName UpdateLabelAttributes
     * @apiPermission admin
     * @apiUse updateAttributes
     */

    /*
     * @api {delete} labels/:id/attributes/:name Detach an attribute
     * @apiGroup Labels
     * @apiName DestroyLabelAttributes
     * @apiPermission admin
     * @apiUse destroyAttributes
     */
}
