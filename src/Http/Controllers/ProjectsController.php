<?php

namespace Biigle\Modules\Projects\Http\Controllers;

use Biigle\Role;
use Biigle\Project;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Views\Controller;

class ProjectsController extends Controller
{
    /**
     * Shows the create project page.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        return view('projects::create');
    }

    /**
     * Shows the project show page.
     *
     * @param Guard $auth
     * @param int $id project ID
     * @return \Illuminate\Http\Response
     */
    public function show(Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $roles = collect([Role::$admin, Role::$editor, Role::$guest]);

        $labelTrees = $project->labelTrees()
            ->select('id', 'name', 'description')
            ->get();

        $volumes = $project->volumes()
            ->select('id', 'name', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();

        $volumes->each(function ($item) {
            $item->append('thumbnail');
        });

        $members = $project->users()
            ->select('id', 'firstname', 'lastname', 'project_role_id as role_id')
            ->orderBy('project_user.project_role_id', 'asc')
            ->get();

        return view('projects::show', [
            'project' => $project,
            'user' => $auth->user(),
            'roles' => $roles,
            'labelTrees' => $labelTrees,
            'volumes' => $volumes,
            'members' => $members,
        ]);
    }

    /**
     * Show the project list.
     *
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth)
    {
        $query = Project::query();
        $user = $auth->user();

        // non admins can only see public trees and private ones they are member of
        if (!$user->isAdmin) {
            $query = $query->whereIn('id', function ($query) use ($user) {
                $query->select('project_id')
                    ->from('project_user')
                    ->where('user_id', $user->id);
            });
        }

        $query = $query->orderBy('updated_at', 'desc');

        return view('projects::index', [
            'projects' => $query->paginate(10),
            // the create new project page redirects here with the newly created project
            'newProject' => session('newProject'),
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
        if (view()->exists('projects::manual.tutorials.'.$name)) {
            return view('projects::manual.tutorials.'.$name);
        } else {
            abort(404);
        }
    }
}
