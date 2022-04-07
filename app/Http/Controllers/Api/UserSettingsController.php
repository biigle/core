<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\UpdateUserSettings;
use Illuminate\Http\Request;

class UserSettingsController extends Controller
{
    /**
     * Update the own user settings
     *
     * @api {put} users/my/settings update the own user settings
     * @apiGroup Users
     * @apiName UpdateSettings
     * @apiPermission user
     * @apiDescription This endpoint is meant for internal use as it accepts dynamic
     * attributes which cannot be documented here.
     *
     * @param UpdateUserSettings $request
     * @return \Illuminate\Http\Response
     */
    public function update(UpdateUserSettings $request)
    {
        $user = $request->user();
        $user->setSettings($request->validated());
        $user->save();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect();
        }
    }
}
