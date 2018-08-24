<?php

namespace Biigle\Modules\Largo\Http\Controllers\Views\Projects;

use Biigle\Project;
use Biigle\Http\Controllers\Views\Controller;

class LargoController extends Controller
{
    /**
     * Show the Largo view for a project.
     *
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('edit-in', $project);

        $labelTrees = $project->labelTrees()
            ->with('labels')
            ->select('id', 'name')
            ->get();

        return view('largo::project', [
            'project' => $project,
            'labelTrees' => $labelTrees,
            'target' => $project,
        ]);
    }
}
