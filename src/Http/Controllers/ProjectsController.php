<?php

namespace Dias\Modules\Projects\Http\Controllers;

use Dias\Project;
use Dias\Role;
use Dias\Http\Controllers\Views\Controller;

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
     * @param int $id project ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        $roles = collect([
            Role::$admin->id => Role::$admin->name,
            Role::$editor->id => Role::$editor->name,
            Role::$guest->id => Role::$guest->name,
        ]);

        $labelTrees = $project->labelTrees()
            ->select('id', 'name', 'description')
            ->get();

        $transects = $project->transects()
            ->select('id', 'name', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();

        $members = $project->users()
            ->select('id', 'firstname', 'lastname', 'project_role_id')
            ->orderBy('project_user.project_role_id', 'asc')
            ->get();

        return view('projects::show', [
            'project' => $project,
            'user' => $this->user,
            'roles' => $roles,
            'labelTrees' => $labelTrees,
            'transects' => $transects,
            'members' => $members,
        ]);
    }

    /**
     * Show the project list
     *
     * @return \Illuminate\Http\Response
     */
    public function index() {
        $query = Project::query();

        // search for trees with similar name to the query string
        if ($this->request->has('query')) {
            if (\DB::connection() instanceof \Illuminate\Database\PostgresConnection) {
                $operator = 'ilike';
            } else {
                $operator = 'like';
            }

            $pattern = $this->request->input('query');
            $query = $query->where('name', $operator, "%{$pattern}%");
            $this->request->flash();
        } else {
            $this->request->flush();
        }

        // non admins can only see public trees and private ones they are member of
        if (!$this->user->isAdmin) {
            $query = $query->whereIn('id', function ($query) {
                $query->select('project_id')
                    ->from('project_user')
                    ->where('user_id', $this->user->id);
            });
        }

        $query = $query->orderBy('updated_at', 'desc');

        return view('projects::index', [
            'projects' => $query->paginate(10),
            // the create new project page redirects here with the newly created project
            'newProject' => session('newProject'),
        ]);
    }
}
