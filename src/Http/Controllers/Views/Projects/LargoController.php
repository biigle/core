<?php

namespace Biigle\Modules\Largo\Http\Controllers\Views\Projects;

use Biigle\Project;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Views\Controller;

class LargoController extends Controller
{
    /**
     * Show the Largo view for a project.
     *
     * @param Guard $auth
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('edit-in', $project);
        $user = $auth->user();

        $labelTrees = $project->labelTrees()
            ->with('labels')
            ->select('id', 'name')
            ->get();

        return view('largo::project', [
            'user' => $user,
            'project' => $project,
            'labelTrees' => $labelTrees,
        ]);
    }
}
