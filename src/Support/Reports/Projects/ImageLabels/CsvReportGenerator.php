<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\ImageLabels;

use Biigle\Modules\Reports\Support\Reports\Projects\ProjectReportGenerator;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageLabels\CsvReportGenerator as ReportGenerator;

class CsvReportGenerator extends ProjectReportGenerator
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
    protected $name = 'CSV image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_image_label_report';
}
