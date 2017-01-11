<?php

namespace Biigle\Modules\Export\Support\Reports\Projects\Annotations;


use Biigle\Modules\Export\Support\Reports\Transects\Annotations\FullReport as TransectReport;

class FullReport extends Report
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
    protected $name = 'full annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'full_annotation_report';
}
