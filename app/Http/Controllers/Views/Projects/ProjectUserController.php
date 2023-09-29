<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Biigle\Role;
use Illuminate\Http\Request;

class ProjectUserController extends Controller
{
    /**
     * Shows the project show page.
     *
     * @param Request $request
     * @param int $id project ID
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $roles = collect([
            Role::admin(),
            Role::expert(),
            Role::editor(),
            Role::guest(),
        ]);

        $roleOrder = [
            Role::guestId(),
            Role::editorId(),
            Role::expertId(),
            Role::adminId(),
        ];

        $members = $project
            ->users()
            ->select('id', 'firstname', 'lastname', 'project_role_id as role_id', 'affiliation')
            ->get()
            ->sort(fn ($a, $b) => array_search($b->role_id, $roleOrder) - array_search($a->role_id, $roleOrder))
            ->values();

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->pivot->pinned;
        $canPin = $isMember && 3 > $request
            ->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

        return view('projects.show.members', [
            'project' => $project,
            'isMember' => $isMember,
            'isPinned' => $isPinned,
            'canPin' => $canPin,
            'activeTab' => 'members',
            'roles' => $roles,
            'members' => $members,
            'invitations' => $project->invitations,
        ]);
    }
}
