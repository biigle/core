<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Projects;

use Biigle\Project;
use Biigle\Modules\Export\Http\Controllers\Api\ReportController;

class ProjectReportController extends ReportController
{
    /*
     * @api {post} projects/:id/reports Generate a new project report
     * @apiGroup Projects
     * @apiName GenerateProjectReport
     *
     * @apiParam {Number} id The project ID.
     *
     * @apiParam (Required arguments) {Number} type_id The report type ID.
     *
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the project.
     * @apiParam (Optional arguments) {Boolean} newest_label If `true`, restrict the report to the newest label of each annotation.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet.
     *
     * @apiPermission projectMember
     *
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
