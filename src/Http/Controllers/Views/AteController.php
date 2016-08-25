<?php

namespace Dias\Modules\Ate\Http\Controllers\Views;

use DB;
use Dias\Role;
use Dias\Project;
use Dias\Transect;
use Dias\LabelTree;
use Dias\Annotation;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Views\Controller;

class AteController extends Controller
{
    /**
     * Show the the ATE view for a transect
     *
     * @param Guard $auth
     * @param int $id Transect ID
     * @return \Illuminate\Http\Response
     */
    public function indexTransect(Guard $auth, $id)
    {
        $transect = Transect::findOrFail($id);
        $this->authorize('edit-in', $transect);
        $user = $auth->user();

        if ($user->isAdmin) {
            // admins have no restrictions
            $projects = $transect->projects;
        } else {
            // all projects that the user and the transect have in common
            // and where the user is editor or admin
            $projects = $user->projects()
                ->whereIn('id', function ($query) use ($transect) {
                    $query->select('project_transect.project_id')
                        ->from('project_transect')
                        ->join('project_user', 'project_transect.project_id', '=', 'project_user.project_id')
                        ->where('project_transect.transect_id', $transect->id)
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

        return view('ate::index', [
            'user' => $user,
            'transect' => $transect,
            'projects' => $projects,
            'labelTrees' => $labelTrees,
        ]);
    }

    /**
     * Show the ATE view for a project
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

        return view('ate::project', [
            'user' => $user,
            'project' => $project,
            'labelTrees' => $labelTrees,
        ]);
    }
}
