<?php

namespace Biigle\Modules\Largo\Http\Controllers\Views\Projects;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Project;
use Illuminate\Http\Response;
use Storage;

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

        if (!$project->volumes()->exists()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $labelTrees = $project->labelTrees()
            ->select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->get();

        $patchUrlTemplate = Storage::disk(config('largo.patch_storage_disk'))
            ->url(':prefix/:id.'.config('largo.patch_format'));

        return view('largo::project', [
            'project' => $project,
            'labelTrees' => $labelTrees,
            'target' => $project,
            'patchUrlTemplate' => $patchUrlTemplate,
        ]);
    }
}
