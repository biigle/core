<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\VideoAnnotations;

use Biigle\Modules\Reports\Support\File;
use Biigle\Modules\Reports\Support\Reports\Projects\ProjectReportGenerator;
use Biigle\Modules\Reports\Support\Reports\Videos\VideoAnnotations\CsvReportGenerator as ReportGenerator;

class CsvReportGenerator extends ProjectReportGenerator
{
    /**
     * The class of the video report to use for this project report.
     *
     * @var string
     */
    protected $reportClass = ReportGenerator::class;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    protected $name = 'CSV video annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'csv_video_annotation_report';

    /**
     * {@inheritdoc}
     */
    protected function getProjectSources()
    {
        return $this->source->videos;
    }
}
