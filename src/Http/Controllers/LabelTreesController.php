<?php

namespace Dias\Modules\LabelTrees\Http\Controllers;

use Dias\LabelTree;
use Dias\Project;
use Dias\Visibility;
use Dias\Http\Controllers\Views\Controller;

class LabelTreesController extends Controller
{
    /**
     * Show the label tree index page
     *
     * @param int $id Label tree ID
     *
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('access', $tree);

        $labels = $tree->labels()
            ->select('id', 'name', 'parent_id', 'color')
            ->get();

        $members = $tree->members()
            ->select('id', 'firstname', 'lastname', 'label_tree_user.role_id')
            ->get();

        $authorizedProjects = $tree->authorizedProjects()
            ->select('id', 'name')
            ->get();

        if ($this->user->isAdmin) {
            $projects = $tree->projects;
            $authorizedOwnProjects = $authorizedProjects->pluck('id');
        } else {
            // all projects of the user that use the label tree
            $projects = Project::whereIn('id', function ($query) use ($id) {
                $query->select('project_user.project_id')
                    ->from('project_user')
                    ->join('label_tree_project', 'project_user.project_id', '=', 'label_tree_project.project_id')
                    ->where('project_user.user_id', $this->user->id)
                    ->where('label_tree_project.label_tree_id', $id);
            })->get();

            // all projects of the user that are authorized to use the label tree
            $authorizedOwnProjects = Project::whereIn('id', function ($query) use ($id) {
                $query->select('project_user.project_id')
                    ->from('project_user')
                    ->join('label_tree_authorized_project', 'project_user.project_id', '=', 'label_tree_authorized_project.project_id')
                    ->where('project_user.user_id', $this->user->id)
                    ->where('label_tree_authorized_project.label_tree_id', $id);
            })->pluck('id');
        }

        return view('label-trees::index')
            ->with('tree', $tree)
            ->with('labels', $labels)
            ->with('projects', $projects)
            ->with('authorizedProjects', $authorizedProjects)
            ->with('authorizedOwnProjects', $authorizedOwnProjects)
            ->with('private', (int) $tree->visibility_id === Visibility::$private->id);
    }
}
