<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\SystemMessage;
use Biigle\SystemMessageType;
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

        if ($request->wantsJson()) {
            return $message;
        }

        return redirect()->route('admin-system-messages-edit', $message->id);
    }

    /**
     * Updates the attributes of the specified system message.
     *
     * @api {put} system-messages/:id Update a system message
     * @apiGroup SystemMessages
     * @apiName UpdateSystemMessages
     * @apiPermission admin
     *
     * @apiParam {Number} id The system message ID.
     *
     * @apiParam (Attributes that can be updated) {String} title Title of the system message
     * @apiParam (Attributes that can be updated) {String} body The body text of the system message. May be formatted with HTML.
     * @apiParam (Attributes that can be updated) {Number} type_id ID of the type of the system message. Default is the 'info' type.
     *
     * @apiParam (Optional parameters) {Boolean} publish If set to `true` the system message will be published.
     *
     * @apiParamExample {String} Request example:
     * title: 'My new system message title'
     * publish: 1
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $message = SystemMessage::findOrFail($id);
        $this->authorize('update', $message);
        $this->validate($request, SystemMessage::$createRules);

        $message->title = $request->input('title', $message->title);
        $message->body = $request->input('body', $message->body);
        $message->type_id = $request->input('type_id', $message->type_id);
        $message->save();

        if ($request->input('publish')) {
            $message->publish();
        }

        if ($request->wantsJson()) {
            return $message;
        }

        return redirect()->route('admin-system-messages-edit', $message->id);
    }

    /**
     * Delete an unpublished system message
     *
     * @api {delete} system-messages/:id Delete a system message
     * @apiGroup SystemMessages
     * @apiName DestroySystemMessages
     * @apiPermission admin
     * @apiDescription Only unpublished system messages can be deleted.
     *
     * @apiParam {Number} id The system message ID.
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        $message = SystemMessage::findOrFail($id);
        $this->authorize('destroy', $message);
        $message->delete();

        if (!$request->wantsJson()) {
            return redirect()->route('admin-system-messages');
        }
    }
}
