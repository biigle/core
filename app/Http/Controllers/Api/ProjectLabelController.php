<?php

namespace Dias\Http\Controllers\Api;

use Dias\Project;

class ProjectLabelController extends Controller
{
    /**
     * Shows a list of all labels belonging to the project.
     *
     * @api {get} projects/:id/labels Get all label categories
     * @apiGroup Projects
     * @apiName IndexProjectLabels
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
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
        $project = Project::findOrFail($id);
        $this->requireCanSee($project);

        return $project->labels;
    }
}
