<?php

namespace Biigle\Modules\Projects\Http\Controllers;

use Biigle\Role;
use Biigle\Project;
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
        $this->authorize('create', Project::class);

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
            Role::admin(),
            Role::expert(),
            Role::editor(),
            Role::guest(),
        ]);

        $labelTrees = $project->labelTrees()
            ->select('id', 'name', 'description')
            ->get();

        $volumes = $project->volumes()
            ->select('id', 'name', 'updated_at')
            ->orderBy('updated_at', 'desc')
            ->get();

        $volumes->each(function ($item) {
            $item->append('thumbnailUrl');
            $item->append('thumbnailsUrl');
        });

        $members = $project->users()
            ->select('id', 'firstname', 'lastname', 'project_role_id as role_id')
            ->orderBy('project_user.project_role_id', 'asc')
            ->get();

        return view('projects::show', [
            'project' => $project,
            'roles' => $roles,
            'labelTrees' => $labelTrees,
            'volumes' => $volumes,
            'members' => $members,
        ]);
    }

    /**
     * Shows the project index page.
     *
     * @deprecated This is a legacy route and got replaced by the global search.
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return redirect()->route('search', ['t' => 'projects']);
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
