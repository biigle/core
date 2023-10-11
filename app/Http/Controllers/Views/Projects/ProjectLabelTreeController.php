<?php

namespace Biigle\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Illuminate\Http\Request;

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
