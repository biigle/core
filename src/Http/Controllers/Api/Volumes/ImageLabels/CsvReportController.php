<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Volumes\ImageLabels;

use Biigle\Modules\Export\Support\Reports\Volumes\ImageLabels\CsvReport;
use Biigle\Modules\Export\Http\Controllers\Api\Volumes\VolumeReportController;

class CsvReportController extends VolumeReportController
{
    /**
     * The report classname.
     *
     * @var string
     */
    protected $report = CsvReport::class;

    /*
     * @api {post} volumes/:id/reports/image-labels/csv Generate a new csv image label report
     * @apiGroup Volumes
     * @apiName GenerateCsvVolumeImageLabelReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the volume.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate image labels of different label trees to different CSV files.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID.
     */
}
