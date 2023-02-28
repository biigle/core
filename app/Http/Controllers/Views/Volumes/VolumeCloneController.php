<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Volume;
use Illuminate\Http\Request;

class VolumeCloneController extends Controller
{

    function clone(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('update', $volume);

        $user = $request->user();

        if ($user->can('sudo')) {
            // Global admins have no restrictions.
            $projectIds = $volume->projects()->pluck('id');
        } else {
            // Array of all project IDs that the user and the volume have in common.
            $projectIds = Project::inCommon($user, $volume->id)->pluck('id');
        }

        // Collection of projects where cloned volume can be copied to.
        $destProjects = $user->projects()->where('project_role_id', \Biigle\Role::adminId())->get();

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
            'name' => $volume->name,
            'destinationProjects' => collect($destProjects)->values(),
            'labelTrees' => $labelTrees
        ]);
    }

}
