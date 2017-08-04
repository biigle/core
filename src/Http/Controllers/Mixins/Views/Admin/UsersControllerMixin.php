<?php

namespace Biigle\Modules\Projects\Http\Controllers\Mixins\Views\Admin;

use Biigle\User;
use Biigle\Project;

class UsersControllerMixin
{
    /**
     * Add project statistics to the view.
     *
     * @param User $user
     *
     * @return array
     */
    public function show(User $user)
    {
        $count = Project::where('creator_id', $user->id)->count();

        $percent = $count > 0 ? round($count / Project::count() * 100, 2) : 0;

        return [
            'projectCount' => $count,
            'projectPercent' => $percent,
        ];
    }
}
