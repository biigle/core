<?php

namespace Biigle\Modules\Largo\Http\Controllers\Views\Projects;

use Storage;
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

        $patchUrlTemplate = Storage::disk(config('largo.patch_storage_disk'))
            ->url('{prefix}/{id}.'.config('largo.patch_format'));

        return view('largo::project', [
            'project' => $project,
            'labelTrees' => $labelTrees,
            'target' => $project,
            'patchUrlTemplate' => $patchUrlTemplate,
        ]);
    }
}
