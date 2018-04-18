<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\Annotations;

use Biigle\Modules\Reports\Support\Reports\Volumes\Annotations\BasicReportGenerator as ReportGenerator;

class BasicReportGenerator extends AnnotationReportGenerator
{
    /**
     * The class of the volume report to use for this project report.
     *
     * @var string
     */
    protected $volumeReportClass = ReportGenerator::class;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'basic annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'basic_annotation_report';
}
