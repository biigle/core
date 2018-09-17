<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api;

use Biigle\User;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;

class SettingsController extends Controller
{
    /**
     * Update the user settings for reports.
     *
     * @api {post} users/my/settings/reports Update the user settings for reports
     * @apiGroup Users
     * @apiName StoreUsersReportsSettings
     * @apiPermission user
     *
     * @apiParam (Optional arguments) {String} report_notifications Set to `'email'` or `'web'` to receive notifications for finished reports either via email or the BIIGLE notification center.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        if (config('reports.notifications.allow_user_settings') === false) {
            abort(404);
        }
        $this->validate($request, [
            'report_notifications' => 'filled|in:email,web',
        ]);
        $settings = $request->only(['report_notifications']);
        $request->user()->setSettings($settings);
    }
}
