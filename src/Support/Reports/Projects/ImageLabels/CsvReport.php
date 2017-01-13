<?php

namespace Biigle\Modules\Export\Support\Reports\Projects\ImageLabels;


use Biigle\Modules\Export\Support\Reports\Projects\Report;
use Biigle\Modules\Export\Support\Reports\Volumes\ImageLabels\CsvReport as VolumeReport;

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
    protected $name = 'CSV image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_image_label_report';
}
