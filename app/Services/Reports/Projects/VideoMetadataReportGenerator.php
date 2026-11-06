<?php

namespace Biigle\Services\Reports\Projects;

use Biigle\Services\Reports\Volumes\VideoMetadataReportGenerator as ReportGenerator;

class VideoMetadataReportGenerator extends ProjectVideoReportGenerator
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
    public $name = 'video metadata report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'video_metadata_report';
}
