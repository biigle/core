<?php

namespace Dias\Http\Controllers\Api;

use Dias\SystemMessage;
use Dias\SystemMessageType;
use Illuminate\Http\Request;

class SystemMessageController extends Controller
{
    /**
     * Creates a new system message.
     *
     * @api {post} system-message Create a new system message
     * @apiGroup SystemMessages
     * @apiName StoreSystemMessages
     * @apiPermission admin
     *
     * @apiParam (Required parameters) {String} title Title of the system message
     * @apiParam (Required parameters) {String} body The body text of the system message. May be formatted with HTML.
     *
     * @apiParam (Optional parameters) {Number} type_id ID of the type of the system message. Default is the 'info' type.
     * @apiParam (Optional parameters) {Boolean} publish Set to `true` if the system message should be published right away instead of just saved as a draft.
     *
     * @apiParamExample {String} Request example:
     * title: 'My new system message'
     * body: 'This is a <strong>new</strong> system message!'
     * publish: 1
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 2,
     *    "title": "My new system message",
     *    "body": "This is a <strong>new</strong> system message!",
     *    "type_id": 3,
     *    "created_at": "2016-04-29 07:38:51",
     *    "updated_at"; "2016-04-29 07:38:51",
     *    "published_at"; "2016-04-29 07:38:51"
     * }
     *
     * @param Request $request
     * @return SystemMessage
     */
    public function store(Request $request)
    {
        $this->authorize('create', SystemMessage::class);
        $this->validate($request, SystemMessage::$createRules);

        $message = SystemMessage::create([
            'title' => $request->input('title'),
            'body' => $request->input('body'),
            'type_id' => $request->input('type_id', SystemMessageType::$info->id),
        ]);

        if ($request->input('publish')) {
            $message->publish();
        }

        return $message;
    }

    /**
     * Updates the attributes of the specified user.
     *
     * @api {put} users/:id Update a user
     * @apiGroup Users
     * @apiName UpdateUsers
     * @apiPermission admin
     * @apiDescription This action is allowed only by session cookie authentication.
     *
     * @apiParam {Number} id The user ID.
     *
     * @apiParam (Attributes that can be updated) {String} email The new email address of the user. Must be unique for all users.
     * @apiParam (Attributes that can be updated) {String} password The new password of the user. If this parameter is set, an additional `password_confirmation` parameter needs to be present, containing the same new password.
     * @apiParam (Attributes that can be updated) {String} firstname The new firstname of the user.
     * @apiParam (Attributes that can be updated) {String} lastname The new lastname of the user.
     * @apiParam (Attributes that can be updated) {Number} role_id Global role of the user. If the role should be changed, an additional `auth_password` field is required, containing the password of the global administrator that requests the change.
     *
     * @apiParamExample {String} Request example:
     * email: 'new@example.com'
     * password: 'TotallySecure'
     * password_confirmation: 'TotallySecure'
     * firstname: 'New'
     * lastname: 'Name'
     * role_id: 1
     * auth_password: 'password123'
     *
     * @param Request $request
     * @param Guard $auth
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {

    }

    /**
     * Removes the specified user.
     *
     * @api {delete} users/:id Delete a user
     * @apiGroup Users
     * @apiName DestroyUsers
     * @apiPermission admin
     * @apiParam (Required parameters) {String} password The password of the global administrator.
     * @apiDescription This action is allowed only by session cookie authentication. If the user is the last admin of a project, they cannot be deleted. The admin role needs to be passed on to another member of the project first.
     *
     * @apiParam {Number} id The user ID.
     *
     * @param Request $request
     * @param Guard $auth
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {

    }
}
