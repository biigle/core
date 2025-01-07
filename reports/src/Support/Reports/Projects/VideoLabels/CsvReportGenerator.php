<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\VideoLabels;

use Biigle\Modules\Reports\Support\Reports\Projects\ProjectVideoReportGenerator;
use Biigle\Modules\Reports\Support\Reports\Volumes\VideoLabels\CsvReportGenerator as ReportGenerator;

class CsvReportGenerator extends ProjectVideoReportGenerator
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
    public $name = 'CSV video label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'csv_video_label_report';
}
