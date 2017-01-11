<?php

namespace Biigle\Http\Controllers\Api;

use Illuminate\Contracts\Auth\Guard;

class NotificationController extends Controller
{
    /**
     * Mark a notification as read
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
     * @param Guard $auth
     * @param int $id Image ID
     * @return \Illuminate\Http\Response
     */
    public function update(Guard $auth, $id)
    {
        $notification = $auth->user()->unreadNotifications()->findOrFail($id);
        $notification->markAsRead();
    }

    /**
     * Delete a read notification
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
     * @param Guard $auth
     * @param int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Guard $auth, $id)
    {
        $notification = $auth->user()->notifications()->findOrFail($id);
        $notification->delete();
    }
}
