<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Projects\ImageLabels;

use Biigle\Modules\Export\Support\Reports\Projects\ImageLabels\CsvReport;
use Biigle\Modules\Export\Http\Controllers\Api\Projects\ProjectReportController;

class CsvReportController extends ProjectReportController
{
    /**
     * The report classname.
     *
     * @var string
     */
    protected $report = CsvReport::class;

    /*
     * @api {post} projects/:id/reports/image-labels/csv Generate a new csv image label report
     * @apiGroup Projects
     * @apiName GenerateCsvVolumeImageLabelReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the volume.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate image labels of different label trees to different CSV files for each volume.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID.
     */
}
