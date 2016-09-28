<?php

namespace Dias\Modules\Export\Http\Controllers\Api\Projects\ImageLabels;

use Dias\Modules\Export\Support\Reports\Projects\ImageLabels\BasicReport;
use Dias\Modules\Export\Http\Controllers\Api\Projects\ProjectReportController;

class BasicReportController extends ProjectReportController
{
    /**
     * The report classname
     *
     * @var string
     */
    protected $report = BasicReport::class;

    /**
     * @api {post} projects/:id/reports/image-labels/basic Generate a new basic image label report
     * @apiGroup Projects
     * @apiName GenerateBasicTransectImageLabelReport
     * @apiParam (Optional arguments) {Boolean} exportArea If `1`, restrict the report to the export area of the transect.
     * @apiPermission projectMember
     *
     * @apiParam {Number} id The transect ID.
     */
}
