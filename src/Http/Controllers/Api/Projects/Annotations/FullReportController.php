<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Projects\Annotations;

use Dias\Modules\Export\Support\Reports\Projects\Annotations\FullReport;
use Dias\Modules\Export\Http\Controllers\Api\Projects\ProjectReportController;

class FullReportController extends ProjectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = FullReport::class;

    /**
     * @api {post} projects/:id/reports/annotations/full Generate a new full annotation report
     * @apiGroup Projects
     * @apiName GenerateFullProjectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the individual transects of the project.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different sheets of the spreadsheet for each transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     */
}
