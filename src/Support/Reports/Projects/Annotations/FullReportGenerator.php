<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\Annotations;

use Biigle\Modules\Reports\Support\Reports\Volumes\Annotations\FullReportGenerator as ReportGenerator;

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
    protected $name = 'full annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'full_annotation_report';
}
