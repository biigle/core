<?php

namespace Biigle\Services\Reports\Projects\ImageAnnotations;

use Biigle\Services\Reports\Volumes\ImageAnnotations\FullReportGenerator as ReportGenerator;

class FullReportGenerator extends AnnotationReportGenerator
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
    public $name = 'full image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'full_image_annotation_report';
}
