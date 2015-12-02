<?php

namespace Dias\Http\Controllers\Api;

use Dias\Project;
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
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return $this->user->projects;
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
        $this->requireCanSee($project);

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
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update($id)
    {
        $project = Project::findOrFail($id);
        $this->requireCanAdmin($project);

        $this->validate($this->request, Project::$updateRules);

        $project->name = $this->request->input('name', $project->name);
        $project->description = $this->request->input('description', $project->description);
        $project->save();

        if (!static::isAutomatedRequest($this->request)) {
            return redirect()->back()
                ->with('message', 'Saved.')
                ->with('messageType', 'success');
        }
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
     * @return Project
     */
    public function store()
    {
        $this->validate($this->request, Project::$createRules);

        $project = new Project;
        $project->name = $this->request->input('name');
        $project->description = $this->request->input('description');
        $project->setCreator($this->user);
        $project->save();

        if (static::isAutomatedRequest($this->request)) {
            // creator shouldn't be returned
            unset($project->creator);

            return $project;
        }

        return redirect()->route('home')
            ->with('message', 'Project '.$project->name.' created')
            ->with('messageType', 'success');
    }

    /**
     * Removes the specified project.
     *
     * @api {delete} projects/:id Delete a project
     * @apiGroup Projects
     * @apiName DestroyProjects
     * @apiPermission projectAdmin
     * @apiDescription A project cannot be deleted if it contains any transects that belong **only** to this project. To delete the project **and** these transects, use the `force` parameter.
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Optional parameters) {Boolean} force Set this parameter to delete the project **and** all transects that belong only to this project.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        $this->requireCanAdmin($project);

        try {
            $project->removeAllTransects($this->request->has('force'));
        } catch (HttpException $e) {
            if (static::isAutomatedRequest($this->request)) {
                abort(400, $e->getMessage());
            }

            return redirect()->back()
                ->with('message', $e->getMessage())
                ->with('messageType', 'danger');
        }
        $project->delete();

        if (static::isAutomatedRequest($this->request)) {
            return response('Deleted.', 200);
        }

        return redirect()->route('home')
            ->with('message', 'Project '.$project->name.' deleted')
            ->with('messageType', 'success');
    }
}
