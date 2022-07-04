<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\ImageAnnotations;

use Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations\AreaReportGenerator as ReportGenerator;

class AreaReportGenerator extends AnnotationReportGenerator
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
    public $name = 'image annotation area report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'image_annotation_area_report';
}
