<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Projects;

use Biigle\Project;
use Biigle\Modules\Export\Http\Controllers\Api\ReportController;

class ProjectReportController extends ReportController
{
    /*
     * @api {post} projects/:pid/reports/:tid Generate a new project report
     * @apiGroup Projects
     * @apiName GenerateProjectReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the project.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     * @apiPermission projectMember
     *
     * @apiParam {Number} vid The project ID.
     * @apiParam {Number} tid The report type ID.
     */

    /**
     * Get the source to generate the report for.
     *
     * @param int $id
     * @return mixed
     */
    protected function getSource($id)
    {
        return Project::findOrFail($id);
    }
}
