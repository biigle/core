<?php

namespace Biigle\Http\Controllers\Views\Notifications;

use Biigle\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    /**
     * Shows the notification center.
     *
     * @param Request $request
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $all = (boolean) $request->input('all', false);
        $notifications = $all ? $user->notifications() : $user->unreadNotifications();
        $notifications = $notifications->get();

        foreach ($notifications as $n) {
            /** @phpstan-ignore property.notFound */
            $n->created_at_diff = $n->created_at->diffForHumans();
        }

        return view('notifications.index', [
            'all' => $all,
            'notifications' => $notifications,
        ]);
    }
}
