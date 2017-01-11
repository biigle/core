<?php

namespace Biigle\Http\Controllers\Views\Notifications;

use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Controller;

class NotificationsController extends Controller
{
    /**
     * Shows the notification center.
     *
     * @param Request $request
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, Guard $auth)
    {
        $all = (boolean) $request->input('all', false);
        $user = $auth->user();
        $notifications = $all ? $user->notifications : $user->unreadNotifications;

        foreach ($notifications as $n) {
            $n->created_at_diff = $n->created_at->diffForHumans();
        }

        return view('notifications.index', [
            'all' => $all,
            'notifications' => $notifications,
        ]);
    }
}
