<?php

namespace Biigle\Modules\LabelTrees\Http\Controllers;

use Biigle\Role;
use Biigle\Project;
use Biigle\LabelTree;
use Biigle\Visibility;
use Biigle\LabelSource;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Views\Controller;

class LabelTreesController extends Controller
{
    /**
     * Show the label tree page.
     *
     * @param Guard $auth
     * @param int $id Label tree ID
     *
     * @return \Illuminate\Http\Response
     */
    public function show(Guard $auth, $id)
    {
        $tree = LabelTree::findOrFail($id);
        $this->authorize('access', $tree);
        $user = $auth->user();

        $labels = $tree->labels()
            ->select('id', 'name', 'parent_id', 'color')
            ->orderBy('name')
            ->get();

        $members = $tree->members()
            ->select('id', 'firstname', 'lastname', 'label_tree_user.role_id')
            ->get();

        $authorizedProjects = $tree->authorizedProjects()
            ->select('id', 'name')
            ->get();

        if ($user->isAdmin) {
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

        $roles = collect([
            Role::$admin->id => Role::$admin->name,
            Role::$editor->id => Role::$editor->name,
        ]);

        $visibilities = collect([
            Visibility::$public->id => Visibility::$public->name,
            Visibility::$private->id => Visibility::$private->name,
        ]);

        $labelSources = LabelSource::all();

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
            // TODO to delete once Vue migration is finished
            'labelSources' => $labelSources,
        ]);
    }

    /**
     * Show the label tree list.
     *
     * @param Request $request
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, Guard $auth)
    {
        $query = LabelTree::query();
        $user = $auth->user();

        // search for trees with similar name to the query string
        if ($request->has('query')) {
            if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
                $operator = 'ilike';
            } else {
                $operator = 'like';
            }

            $pattern = $request->input('query');
            $query = $query->where('name', $operator, "%{$pattern}%");
            $request->flash();
        } else {
            $request->flush();
        }

        // non admins can only see public trees and private ones they are member of
        if (!$user->isAdmin) {
            $query = $query->where('visibility_id', Visibility::$public->id)
                ->orWhere(function ($query) use ($user) {
                    $query->whereIn('id', function ($query) use ($user) {
                        $query->select('label_tree_id')
                            ->from('label_tree_user')
                            ->where('user_id', $user->id);
                    });
                });
        }

        $query = $query->orderBy('updated_at', 'desc');

        return view('label-trees::index', [
            'trees' => $query->paginate(10),
            // the create new tree page redirects here with the newly created tree
            'newTree' => session('newTree'),
        ]);
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
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $visibilities = [
            Visibility::$public,
            Visibility::$private,
        ];

        return view('label-trees::create', [
            'visibilities' => $visibilities,
        ]);
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
