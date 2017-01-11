<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Transects\ImageLabels;

use Biigle\Modules\Export\Support\Reports\Transects\ImageLabels\CsvReport;
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
     * @api {post} transects/:id/reports/image-labels/csv Generate a new csv image label report
     * @apiGroup Transects
     * @apiName GenerateCsvTransectImageLabelReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the transect.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate image labels of different label trees to different CSV files.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
