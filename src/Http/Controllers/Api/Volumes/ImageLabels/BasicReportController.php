<?php

namespace Biigle\Modules\Export\Http\Controllers\Api\Volumes\ImageLabels;

use Biigle\Modules\Export\Support\Reports\Volumes\ImageLabels\BasicReport;
use Biigle\Modules\Export\Http\Controllers\Api\Volumes\VolumeReportController;

class BasicReportController extends VolumeReportController
{
    /**
     * The report classname.
     *
     * @var string
     */
    protected $report = BasicReport::class;

    /*
     * @api {post} volumes/:id/reports/image-labels/basic Generate a new basic image label report
     * @apiGroup Volumes
     * @apiName GenerateBasicVolumeImageLabelReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `true`, restrict the report to the export area of the volume.
     * @apiParam (Optional arguments) {Boolean} separateLabelTrees If `true`, separate image labels of different label trees to different sheets of the spreadsheet.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The volume ID.
     */
}
