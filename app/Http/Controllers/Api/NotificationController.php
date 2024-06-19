<?php

namespace Biigle\Http\Controllers\Api;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Mark a notification as read.
     *
     * @api {put} notifications/:id Mark as read
     * @apiGroup Notifications
     * @apiName UpdateReadNotifications
     * @apiPermission user
     *
     * @apiParam {Number} id The notification UID
     * @apiParamExample {String} Request example:
     * id: "0972569c-2d3e-444d-8e7d-2054e7ab20e9"
     *
     * @param Request $request
     * @param int $id Image ID
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $notification = $request->user()->unreadNotifications()->findOrFail($id);
        $notification->markAsRead();
    }

    /**
     * Mark all notification as read.
     *
     * @api {put} notifications/all Mark all notifications as read
     * @apiGroup Notifications
     * @apiName UpdateReadNotifications
     * @apiPermission user
     *
     * @param Request $request
     */
    public function updateAll(Request $request)
    {
        $request->user()->unreadNotifications()->eachById(fn ($n) => $n->markAsRead());
    }

    /**
     * Delete a read notification.
     *
     * @api {delete} notifications/:id Delete read notification
     * @apiGroup Notifications
     * @apiName DeleteReadNotification
     * @apiPermission user
     *
     * @apiParam {Number} id The notification UID
     * @apiParamExample {String} Request example:
     * id: "0972569c-2d3e-444d-8e7d-2054e7ab20e9"
     *
     * @param Request $request
     * @param int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->delete();
    }
}
