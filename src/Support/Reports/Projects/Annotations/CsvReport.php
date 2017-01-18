<?php

namespace Biigle\Modules\Export\Support\Reports\Projects\Annotations;

use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\CsvReport as VolumeReport;

class CsvReport extends Report
{
    /**
     * The class of the volume report to use for this project report.
     *
     * @var string
     */
    protected $volumeReportClass = VolumeReport::class;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'CSV annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_annotation_report';
}
