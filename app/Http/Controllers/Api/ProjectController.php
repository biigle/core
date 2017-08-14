<?php

namespace Biigle\Http\Controllers\Api;

use Route;
use Biigle\Project;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ProjectController extends Controller
{
    /**
     * Shows all projects the requesting user belongs to.
     *
     * @api {get} projects/my Get all own projects
     * @apiGroup Projects
     * @apiName IndexOwnProjects
     * @apiPermission user
     * @apiDescription Returns a list of all projects, the requesting user is a member of.
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
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth)
    {
        return $auth->user()->projects;
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
     * @param Request $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);

        $this->validate($request, Project::$updateRules);

        $project->name = $request->input('name', $project->name);
        $project->description = $request->input('description', $project->description);
        $project->save();

        if (static::isAutomatedRequest($request)) {
            return;
        }

        if ($request->has('_redirect')) {
            return redirect($request->input('_redirect'))
                ->with('saved', true)
                ->with('message', 'Project updated.')
                ->with('messageType', 'success');
        }

        return redirect()->back()
            ->with('saved', true)
            ->with('message', 'Project updated.')
            ->with('messageType', 'success');
    }

    /**
     * Creates a new project.
     *
     * @api {post} projects Create a new project
     * @apiGroup Projects
     * @apiName StoreProjects
     * @apiPermission user
     * @apiDescription The user creating a new project will automatically become project admin.
     *
     * @apiParam (Required attributes) {String} name Name of the new project.
     * @apiParam (Required attributes) {String} description Description of the new project.
     *
     * @param Request $request
     * @param Guard $auth
     * @return Project
     */
    public function store(Request $request, Guard $auth)
    {
        $this->validate($request, Project::$createRules);

        $project = new Project;
        $project->name = $request->input('name');
        $project->description = $request->input('description');
        $project->setCreator($auth->user());
        $project->save();

        if (static::isAutomatedRequest($request)) {
            // creator shouldn't be returned
            unset($project->creator);

            return $project;
        }

        if ($request->has('_redirect')) {
            return redirect($request->input('_redirect'))
                ->with('newProject', $project)
                ->with('message', 'Project created.')
                ->with('messageType', 'success');
        }

        if (Route::has('project')) {
            return redirect()->route('project', $project->id)
                ->with('message', 'Project created.')
                ->with('messageType', 'success');
        }

        return redirect()->back()
            ->with('newProject', $project)
            ->with('message', 'Project created.')
            ->with('messageType', 'success');
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
            $project->removeAllVolumes($request->has('force'));
        } catch (HttpException $e) {
            if (static::isAutomatedRequest($request)) {
                abort(400, $e->getMessage());
            }

            return redirect()->back()
                ->with('message', $e->getMessage())
                ->with('messageType', 'danger');
        }
        $project->delete();

        if (static::isAutomatedRequest($request)) {
            return;
        }

        if ($request->has('_redirect')) {
            return redirect($request->input('_redirect'))
                ->with('deleted', true)
                ->with('message', 'Project deleted.')
                ->with('messageType', 'success');
        }

        return redirect()->back()
            ->with('deleted', true)
            ->with('message', 'Project deleted.')
            ->with('messageType', 'success');
    }
}
