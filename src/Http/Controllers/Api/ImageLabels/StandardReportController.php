<?php

namespace Dias\Modules\Export\Http\Controllers\Api\ImageLabels;

use Dias\Project;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Api\Controller;
use Dias\Modules\Export\Jobs\GenerateReportJob;
use Dias\Modules\Export\Support\Reports\ImageLabels\StandardReport;

class StandardReportController extends Controller
{
    /**
     * Generate an image label report
     *
     * @api {post} projects/:id/reports/image-labels Generate a new image label report
     * @apiGroup Projects
     * @apiName GenerateImageLabelProjectReport
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     *
     * @param Guard $auth
     * @param int $id project id
     * @return \Illuminate\Http\Response
     */
    public function store(Guard $auth, $id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('access', $project);
        $this->dispatch(
            new GenerateReportJob(new StandardReport($project), $auth->user())
        );
    }
}
