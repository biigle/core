<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Biigle\Role;
use Biigle\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

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
        if (!config('biigle.project_overview_v2_preview')) {
            abort(Response::HTTP_NOT_FOUND);
        }

        if ($request->user()->getSettings('project_overview_v1', false)) {
            return redirect()->route('project', $id);
        }

        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $members = $project->users()
            ->select('id', 'firstname', 'lastname', 'project_role_id as role_id', 'affiliation')
            ->orderBy('project_user.project_role_id', 'asc')
            ->get();

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->pivot->pinned;
        $canPin = $isMember && 3 > $request->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

        return view('projects.show.members', [
            'project' => $project,
            'isMember' => $isMember,
            'isPinned' => $isPinned,
            'canPin' => $canPin,
            'activeTab' => 'members',
            'members' => $members,
        ]);
    }
}
