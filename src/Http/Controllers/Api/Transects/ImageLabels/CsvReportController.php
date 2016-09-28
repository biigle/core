<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Transects\ImageLabels;

use Dias\Modules\Export\Support\Reports\Transects\ImageLabels\CsvReport;
use Dias\Modules\Export\Http\Controllers\Api\Transects\TransectReportController;

class CsvReportController extends TransectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = CsvReport::class;

    /**
     * @api {post} transects/:id/reports/image-labels/csv Generate a new csv image label report
     * @apiGroup Transects
     * @apiName GenerateCsvTransectImageLabelReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
