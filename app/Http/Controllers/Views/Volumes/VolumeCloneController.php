<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use \Illuminate\Contracts\View\View;
use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Role;
use Biigle\Volume;
use Illuminate\Http\Request;

class VolumeCloneController extends Controller
{
    /**
     * Shows the volume clone page.
     * @param Request $request
     * @param $id volume ID
     *
     * @return View
     **/
    public function clone(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);

        $user = $request->user();

        if ($user->can('sudo')) {
            // Global admins have no restrictions.
            $projectIds = $volume->projects()->pluck('id');
            $destProjectQuery = Project::getQuery();
        } else {
            // Array of all project IDs that the user and the volume have in common.
            $projectIds = Project::inCommon($user, $volume->id)->pluck('id');
            $destProjectQuery = $user->projects()->where('project_role_id', Role::adminId());
        }

        // Collection of projects where cloned volume can be copied to.
        $destProjects = $destProjectQuery->select('name', 'id')->get();

        $labelTrees = LabelTree::select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->whereIn('id', function ($query) use ($projectIds) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projectIds);
            })
            ->get();


        return view('volumes.clone', [
            'volume' => $volume,
            'destinationProjects' => $destProjects,
            'labelTrees' => $labelTrees
        ]);
    }
}
