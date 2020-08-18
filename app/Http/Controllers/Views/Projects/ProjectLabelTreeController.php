<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Biigle\Role;
use Biigle\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProjectLabelTreeController extends Controller
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

        $labelTrees = $project->labelTrees()
            ->select('id', 'name', 'description', 'version_id')
            ->with('version')
            ->get();

        $userProject = $request->user()->projects()->where('id', $id)->first();
        $isMember = $userProject !== null;
        $isPinned = $isMember && $userProject->pivot->pinned;
        $canPin = $isMember && 3 > $request->user()
            ->projects()
            ->wherePivot('pinned', true)
            ->count();

        return view('projects.show.label-trees', [
            'project' => $project,
            'isMember' => $isMember,
            'isPinned' => $isPinned,
            'canPin' => $canPin,
            'activeTab' => 'label-trees',
            'labelTrees' => $labelTrees,
        ]);
    }
}
