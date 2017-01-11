<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Projects\Annotations;

use Biigle\Modules\Export\Support\Reports\Projects\Annotations\CsvReport;
use Biigle\Modules\Export\Http\Controllers\Api\Projects\ProjectReportController;

class CsvReportController extends ProjectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = CsvReport::class;

    /**
     * @api {post} projects/:id/reports/annotations/csv Generate a new csv annotation report
     * @apiGroup Projects
     * @apiName GenerateCsvProjectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the individual transects of the project.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different CSV files for each transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The project ID.
     */
}
