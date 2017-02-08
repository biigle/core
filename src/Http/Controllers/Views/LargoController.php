<?php

namespace Biigle\Modules\Largo\Http\Controllers\Views;

use Biigle\Role;
use Biigle\Project;
use Biigle\Volume;
use Biigle\LabelTree;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Views\Controller;

class LargoController extends Controller
{
    /**
     * Show the the Largo view for a volume.
     *
     * @param Guard $auth
     * @param int $id Volume ID
     * @return \Illuminate\Http\Response
     */
    public function indexVolume(Guard $auth, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('edit-in', $volume);
        $user = $auth->user();

        if ($user->isAdmin) {
            // admins have no restrictions
            $projects = $volume->projects;
        } else {
            // all projects that the user and the volume have in common
            // and where the user is editor or admin
            $projects = $user->projects()
                ->whereIn('id', function ($query) use ($volume) {
                    $query->select('project_volume.project_id')
                        ->from('project_volume')
                        ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                        ->where('project_volume.volume_id', $volume->id)
                        ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id]);
                })
                ->get();
        }

        // all label trees that are used by all projects which are visible to the user
        $labelTrees = LabelTree::with('labels')
            ->select('id', 'name')
            ->whereIn('id', function ($query) use ($projects) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projects->pluck('id'));
            })
            ->get();

        return view('largo::show', [
            'user' => $user,
            'volume' => $volume,
            'projects' => $projects,
            'labelTrees' => $labelTrees,
        ]);
    }

    /**
     * Show the Largo view for a project.
     *
     * @param Guard $auth
     * @param int $id Project ID
     * @return \Illuminate\Http\Response
     */
    public function indexProject(Guard $auth, $id)
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
