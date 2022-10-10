<?php

namespace Biigle\Http\Controllers\Api;

use Biigle\Http\Requests\StoreProject;
use Biigle\Http\Requests\UpdateProject;
use Biigle\Project;
use Illuminate\Http\Request;
use Route;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ProjectController extends Controller
{
    /**
     * Shows all projects that are accessible by the requesting user.
     *
     * @api {get} projects Get all accessible projects
     * @apiGroup Projects
     * @apiName IndexProjects
     * @apiPermission user
     * @apiDescription Returns a list of all projects, the requesting user can access.
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "id": 1,
     *       "name": "Test Project",
     *       "description": "This is a test project.",
     *       "creator_id": 1,
     *       "created_at": "2015-02-10 09:45:30",
     *       "updated_at": "2015-02-10 09:45:30"
     *    }
     * ]
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        if ($request->user()->can('sudo')) {
            return Project::all();
        }

        return $request->user()->projects;
    }

    /**
     * Displays the specified project.
     *
     * @api {get} projects/:id Get a project
     * @apiGroup Projects
     * @apiName ShowProjects
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "id": 1,
     *    "name": "Test Project",
     *    "description": "This is a test project.",
     *    "creator_id": 1,
     *    "created_at": "2015-02-10 09:45:30",
     *    "updated_at": "2015-02-10 09:45:30"
     * }
     *
     * @param  int  $id
     * @return Project
     */
    public function show($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);

        return $project;
    }

    /**
     * Creates a new project.
     *
     * @api {post} projects Create a new project
     * @apiGroup Projects
     * @apiName StoreProjects
     * @apiPermission editor
     * @apiDescription The user creating a new project will automatically become project admin.
     *
     * @apiParam (Required attributes) {String} name Name of the new project.
     * @apiParam (Required attributes) {String} description Description of the new project.
     *
     * @param StoreProject $request
     * @return Project
     */
    public function store(StoreProject $request)
    {
        $project = new Project;
        $project->name = $request->input('name');
        $project->description = $request->input('description');
        $project->creator_id = $request->user()->id;
        $project->save();

        if ($this->isAutomatedRequest()) {
            return $project;
        }

        return $this->fuzzyRedirect('project', $project->id)
            ->with('newProject', $project)
            ->with('message', 'Project created.')
            ->with('messageType', 'success');
    }

    /**
     * Updates the attributes of the specified project.
     *
     * @api {put} projects/:id Update a project
     * @apiGroup Projects
     * @apiName UpdateProjects
     * @apiPermission projectAdmin
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Attributes that can be updated) {String} name Name of the project.
     * @apiParam (Attributes that can be updated) {String} description Description of the project.
     *
     * @param UpdateProject $request
     * @return \Illuminate\Http\Response
     */
    public function update(UpdateProject $request)
    {
        $project = $request->project;
        $project->name = $request->input('name', $project->name);
        $project->description = $request->input('description', $project->description);
        $project->save();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('saved', true)
                ->with('message', 'Project updated.')
                ->with('messageType', 'success');
        }
    }

    /**
     * Removes the specified project.
     *
     * @api {delete} projects/:id Delete a project
     * @apiGroup Projects
     * @apiName DestroyProjects
     * @apiPermission projectAdmin
     * @apiDescription A project cannot be deleted if it contains any volumes that belong **only** to this project. To delete the project **and** these volumes, use the `force` parameter.
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Optional parameters) {Boolean} force Set this parameter to delete the project **and** all volumes that belong only to this project.
     *
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('destroy', $project);

        try {
            $project->removeAllVolumes($request->filled('force'));
        } catch (HttpException $e) {
            if ($this->isAutomatedRequest()) {
                abort(400, $e->getMessage());
            }

            return redirect()->back()
                ->with('message', $e->getMessage())
                ->with('messageType', 'danger');
        }

        $project->delete();

        if (!$this->isAutomatedRequest()) {
            return $this->fuzzyRedirect()
                ->with('deleted', true)
                ->with('message', 'Project deleted.')
                ->with('messageType', 'success');
        }
    }
}
