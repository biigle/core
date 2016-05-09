<?php

namespace Dias\Modules\Export\Http\Controllers\Api;

use Dias\Http\Controllers\Api\Controller;
use Dias\Project;
use Dias\Modules\Export\Jobs\GenerateBasicReport;

class ReportsController extends Controller
{
    /**
     * Generate a basic report
     *
     * @api {post} projects/:id/reports/basic Generate a new report
     * @apiGroup Projects
     * @apiName GenerateBasicProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The image ID.
     *
     * @param int $id image id
     * @return \Illuminate\Http\Response
     */
    public function basic($id)
    {
        $project = Project::findOrFail($id);
        $this->requireCanSee($project);

        $this->dispatch(new GenerateBasicReport($project));
    }
}
