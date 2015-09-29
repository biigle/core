<?php

namespace Dias\Http\Controllers\Api;

use Dias\User;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

class UserAttributeController extends ModelWithAttributesController
{
    /**
     * Creates a new UserAttributeController instance.
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
        return User::find($id);
    }

    // API DOC FOR INHERITED METHODS

    /**
     * @api {get} users/:id/attributes Get all attributes
     * @apiGroup User
     * @apiName IndexUserAttributes
     * @apiUse indexAttributes
     * @apiPermission user
     */

    /**
     * @api {get} users/:id/attributes/:name Get an attribute
     * @apiGroup User
     * @apiName ShowUserAttributes
     * @apiUse showAttributes
     * @apiPermission user
     */

    /**
     * @api {post} users/:id/attributes Attach an attribute
     * @apiGroup User
     * @apiName StoreUserAttributes
     * @apiPermission admin
     * @apiUse storeAttributes
     */

    /**
     * @api {put} users/:id/attributes/:name Update an attribute
     * @apiGroup User
     * @apiName UpdateUserAttributes
     * @apiPermission admin
     * @apiUse updateAttributes
     */

    /**
     * @api {delete} users/:id/attributes/:name Detach an attribute
     * @apiGroup User
     * @apiName DestroyUserAttributes
     * @apiPermission admin
     * @apiUse destroyAttributes
     */
}
