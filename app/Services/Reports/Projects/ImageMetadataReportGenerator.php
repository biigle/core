<?php

namespace Biigle\Services\Reports\Projects;

use Biigle\Services\Reports\Volumes\ImageMetadataReportGenerator as ReportGenerator;

class ImageMetadataReportGenerator extends ProjectImageReportGenerator
{
    /**
     * The class of the image report to use for this project report.
     *
     * @var string
     */
    protected $reportClass = ReportGenerator::class;

    /**
     * Name of the report for use in text.
     *
     * @var string
     */
    public $name = 'image metadata report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'image_metadata_report';
}
