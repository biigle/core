<?php

namespace Biigle\Services\Reports\Projects\ImageLabels;

use Biigle\Services\Reports\Projects\ProjectImageReportGenerator;
use Biigle\Services\Reports\Volumes\ImageLabels\BasicReportGenerator as ReportGenerator;

class BasicReportGenerator extends ProjectImageReportGenerator
{
    /**
     * The class of the volume report to use for this project report.
     *
     * @var string
     */
    protected $reportClass = ReportGenerator::class;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'basic image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'basic_image_label_report';
}
