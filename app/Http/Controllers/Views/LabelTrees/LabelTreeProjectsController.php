<?php

namespace Biigle\Http\Controllers\Views\LabelTrees;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\User;
use Biigle\Visibility;
use Illuminate\Http\Request;

class LabelTreeProjectsController extends Controller
{
    /**
     * Shows the label tree projects page.
     *
     * @param Request $request
     * @param int $id project ID
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $tree = LabelTree::findOrFail($id);

        $this->authorize('access', $tree);
        $user = $request->user();

        if (is_null($tree->version_id)) {
            return $this->showMasterLabelTree($tree, $user);
        }

        return $this->showVersionedLabelTree($tree, $user);
    }

    /**
     * Show the label tree projects page of a master label tree.
     *
     * @param LabelTree $tree
     * @param User $user
     *
     * @return \Illuminate\Http\Response
     */
    protected function showMasterLabelTree(LabelTree $tree, User $user)
    {
        $authorizedProjects = $tree->authorizedProjects()
            ->select('id', 'name', 'description')
            ->get();

        if ($user->can('sudo')) {
            $projects = $tree->projects;
            $authorizedOwnProjects = $authorizedProjects->pluck('id');
        } else {
            // all projects of the user that use the label tree
            $projects = Project::whereIn('id', function ($query) use ($user, $tree) {
                $query->select('project_user.project_id')
                    ->from('project_user')
                    ->join('label_tree_project', 'project_user.project_id', '=', 'label_tree_project.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('label_tree_project.label_tree_id', $tree->id);
            })->get();

            // all projects of the user that are authorized to use the label tree
            $authorizedOwnProjects = Project::whereIn('id', function ($query) use ($user, $tree) {
                $query->select('project_user.project_id')
                    ->from('project_user')
                    ->join('label_tree_authorized_project', 'project_user.project_id', '=', 'label_tree_authorized_project.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('label_tree_authorized_project.label_tree_id', $tree->id);
            })->pluck('id');
        }

        $visibilities = collect([
            Visibility::publicId() => Visibility::public()->name,
            Visibility::privateId() => Visibility::private()->name,
        ]);

        return view('label-trees.show.projects', [
            'tree' => $tree,
            'projects' => $projects,
            'visibilities' => $visibilities,
            'authorizedProjects' => $authorizedProjects,
            'authorizedOwnProjects' => $authorizedOwnProjects,
            'private' => $tree->visibility_id === Visibility::privateId(),
            'activeTab' => 'projects',
        ]);
    }

    /**
     * Show the label tree page projects of a versioned label tree.
     *
     * @param LabelTree $tree
     * @param User $user
     *
     * @return \Illuminate\Http\Response
     */
    protected function showVersionedLabelTree(LabelTree $tree, User $user)
    {
        if ($user->can('sudo')) {
            $projects = $tree->projects;
        } else {
            // All projects of the user that use the label tree version.
            $projects = Project::whereIn('id', function ($query) use ($user, $tree) {
                $query->select('project_user.project_id')
                    ->from('project_user')
                    ->join('label_tree_project', 'project_user.project_id', '=', 'label_tree_project.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('label_tree_project.label_tree_id', $tree->id);
            })->get();
        }

        return view('label-trees.versions.show.projects', [
            'version' => $tree->version,
            'tree' => $tree,
            'masterTree' => $tree->version->labelTree,
            'projects' => $projects,
            'private' => $tree->visibility_id === Visibility::privateId(),
            'activeTab' => 'projects',
        ]);
    }
}
