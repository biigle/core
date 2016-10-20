<?php

namespace Dias\Modules\Export\Support\Reports\Projects\ImageLabels;


use Dias\Modules\Export\Support\Reports\Projects\Report;
use Dias\Modules\Export\Support\Reports\Transects\ImageLabels\BasicReport as TransectReport;

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
    protected $name = 'basic image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'basic_image_label_report';
}
