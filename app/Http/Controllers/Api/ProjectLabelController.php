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

    /**
     * Displays the specified label.
     *
     * @api {get} labels/:id Get a label category
     * @apiGroup Labels
     * @apiName ShowLabels
     * @apiPermission user
     *
     * @apiParam {Number} pid The project ID.
     * @apiParam {Number} lid The label ID.
     *
     * @apiSuccessExample {json} Success response:
     * {
     *    "aphia_id": null,
     *    "id": 1,
     *    "name": "Benthic Object",
     *    "parent_id": null,
     *    "project_id": 1
     * }
     *
     * @param  int  $pid Project ID
     * @param  int  $lid Label ID
     * @return Label
     */
    public function show($pid, $lid)
    {
        $project = $this->requireNotNull(Project::find($pid));
        $this->requireCanSee($project);
        return $this->requireNotNull($project->labels()->find($lid));
    }
}
