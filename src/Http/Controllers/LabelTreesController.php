<?php

namespace Biigle\Modules\LabelTrees\Http\Controllers;

use Biigle\Role;
use Biigle\Project;
use Biigle\LabelTree;
use Biigle\Visibility;
use Biigle\LabelSource;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Views\Controller;

class LabelTreesController extends Controller
{
    /**
     * Show the label tree page.
     *
     * @param Request $request
     * @param int $id Label tree ID
     *
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('access', $tree);
        $user = $request->user();

        $labels = $tree->labels()
            ->select('id', 'name', 'parent_id', 'color', 'source_id')
            ->get();

        $members = $tree->members()
            ->select('id', 'firstname', 'lastname', 'label_tree_user.role_id')
            ->get();

        $authorizedProjects = $tree->authorizedProjects()
            ->select('id', 'name')
            ->get();

        if ($user->can('sudo')) {
            $projects = $tree->projects;
            $authorizedOwnProjects = $authorizedProjects->pluck('id');
        } else {
            // all projects of the user that use the label tree
            $projects = Project::whereIn('id', function ($query) use ($user, $id) {
                $query->select('project_user.project_id')
                    ->from('project_user')
                    ->join('label_tree_project', 'project_user.project_id', '=', 'label_tree_project.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('label_tree_project.label_tree_id', $id);
            })->get();

            // all projects of the user that are authorized to use the label tree
            $authorizedOwnProjects = Project::whereIn('id', function ($query) use ($user, $id) {
                $query->select('project_user.project_id')
                    ->from('project_user')
                    ->join('label_tree_authorized_project', 'project_user.project_id', '=', 'label_tree_authorized_project.project_id')
                    ->where('project_user.user_id', $user->id)
                    ->where('label_tree_authorized_project.label_tree_id', $id);
            })->pluck('id');
        }

        $roles = collect([Role::$admin, Role::$editor]);

        $visibilities = collect([
            Visibility::$public->id => Visibility::$public->name,
            Visibility::$private->id => Visibility::$private->name,
        ]);

        return view('label-trees::show', [
            'tree' => $tree,
            'labels' => $labels,
            'projects' => $projects,
            'members' => $members,
            'roles' => $roles,
            'visibilities' => $visibilities,
            'user' => $user,
            'authorizedProjects' => $authorizedProjects,
            'authorizedOwnProjects' => $authorizedOwnProjects,
            'private' => (int) $tree->visibility_id === Visibility::$private->id,
            'wormsLabelSource' => LabelSource::where('name', 'worms')->first(),
        ]);
    }

    /**
     * Show the label tree list.
     *
     * @deprecated This is a legacy route and got replaced by the global search.
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return redirect()->route('search', ['t' => 'label-trees']);
    }

    /**
     * Show the label tree admin page.
     *
     * @return \Illuminate\Http\Response
     */
    public function admin()
    {
        $trees = LabelTree::whereDoesntHave('members')->get();

        return view('label-trees::admin', [
            'trees' => $trees,
        ]);
    }

    /**
     * Show the create label tree page.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function create(Request $request)
    {
        $visibilities = [
            Visibility::$private,
            Visibility::$public,
        ];

        if ($request->filled('project')) {
            $project = Project::findOrFail($request->input('project'));
            $this->authorize('update', $project);
        } else {
            $project = null;
        }

        $selectedVisibility = (int) old('visibility_id') ?: $visibilities[0]->id;

        return view('label-trees::create', compact(
            'visibilities',
            'selectedVisibility',
            'project'
        ));
    }

    /**
     * Show a tutorials article.
     *
     * @param string $name Article name
     * @return \Illuminate\Http\Response
     */
    public function tutorial($name)
    {
        if (view()->exists('label-trees::manual.tutorials.'.$name)) {
            return view('label-trees::manual.tutorials.'.$name);
        } else {
            abort(404);
        }
    }
}
