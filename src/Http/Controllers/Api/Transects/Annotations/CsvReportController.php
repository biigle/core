<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Transects\Annotations;

use Biigle\Modules\Export\Support\Reports\Transects\Annotations\CsvReport;
use Biigle\Modules\Export\Http\Controllers\Api\Transects\TransectReportController;

class CsvReportController extends TransectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = CsvReport::class;

    /**
     * @api {post} transects/:id/reports/annotations/csv Generate a new csv annotation report
     * @apiGroup Transects
     * @apiName GenerateCsvTransectAnnotationReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the transect.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate annotations with labels of different label trees to different CSV files.
     * @apiParam (Optional arguments) {Number} annotationSession ID of an annotation session of the transect. If given, only annotations belonging to the annotation session are included in the report.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
