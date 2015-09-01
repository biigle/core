<?php

namespace Dias\Http\Controllers\Api;

use Dias\Project;

class ProjectLabelController extends Controller
{
    /**
     * Shows a list of all labels belonging to the project.
     *
     * @api {get} labels Get all label categories of the project
     * @apiGroup Projects
     * @apiName IndexLabels
     * @apiPermission projectMember
     *
     * @apiSuccessExample {json} Success response:
     * [
     *    {
     *       "aphia_id": null,
     *       "id": 1,
     *       "name": "Benthic Object",
     *       "parent_id": null,
     *       "project_id": 1
     *    },
     *    {
     *       "aphia_id": null,
     *       "id": 2,
     *       "name": "Coral",
     *       "parent_id": 1,
     *       "project_id": 1
     *    }
     * ]
     *
     * @param int $id Project ID.
     * @return \Illuminate\Http\Response
     */
    public function index($id)
    {
        $project = $this->requireNotNull(Project::find($id));
        $this->requireCanSee($project);
        return $project->labels;
    }
}
