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
        $projectsTotal = Project::count();

        $creatorProjects = Project::where('creator_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->select('id', 'name')
            ->get();
        $creatorCount = $creatorProjects->count();
        $creatorPercent = $creatorCount > 0 ? round($creatorCount / $projectsTotal * 100, 2) : 0;

        $memberProjects = Project::join('project_user', 'projects.id', '=', 'project_user.project_id')
            ->orderBy('projects.created_at', 'desc')
            ->where('project_user.user_id', $user->id)
            ->select('projects.id', 'projects.name')
            ->get();
        $memberCount = $memberProjects->count();
        $memberPercent = $memberCount > 0 ? round($memberCount / $projectsTotal * 100, 2) : 0;

        return compact('creatorProjects', 'creatorCount', 'creatorPercent', 'memberProjects', 'memberCount', 'memberPercent');
    }
}
