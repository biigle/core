<?php

namespace Dias\Modules\Export\Support\Reports\Projects\Annotations;


use Dias\Modules\Export\Support\Reports\Transects\Annotations\ExtendedReport as TransectReport;

class ExtendedReport extends Report
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
    protected $name = 'extended annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'extended_annotation_report';
}
