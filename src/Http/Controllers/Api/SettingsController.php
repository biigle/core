<?php

namespace Biigle\Modules\Reports\Http\Controllers\Api;

use Biigle\User;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;

class SettingsController extends Controller
{
    /**
     * Validation rules for the settings handled by this controller.
     *
     * Only setting keys that are present in this array will be accepted.
     *
     * @var array
     */
    const VALIDATION_RULES = [
        'report_notifications' => 'filled|in:email,web',
    ];

    /**
     * Update the user settings for reports
     *
     * @api {post} users/my/settings/reports Update the user settings for reports
     * @apiGroup Users
     * @apiName StoreUsersReportsSettings
     * @apiPermission user
     *
     * @apiParam (Optional arguments) {String} report_notifications Set to `'email'` or `'web'` to receive notifications for finished reports either via email or the BIIGLE notification center.
     *
     * @param Request $request
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $this->validate($request, self::VALIDATION_RULES);
        $settings = $request->only(array_keys(self::VALIDATION_RULES));
        if (config('reports.notifications.allow_user_settings') === false) {
            unset($settings['report_notifications']);
        }
        $request->user()->setSettings($settings);
    }
}
