<?php

namespace Biigle\Modules\Export\Support\Reports\Projects\Annotations;


use Biigle\Modules\Export\Support\Reports\Transects\Annotations\BasicReport as TransectReport;

class BasicReport extends Report
{
    /**
     * The class of the transect report to use for this project report.
     *
     * @var string
     */
    protected $transectReportClass = TransectReport::class;

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
