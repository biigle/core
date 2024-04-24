<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects;

use Biigle\Modules\MetadataIfdo\VideoIfdoParser;
use Biigle\Modules\Reports\Support\Reports\Volumes\VideoIfdoReportGenerator as ReportGenerator;
use Exception;

class VideoIfdoReportGenerator extends ProjectVideoReportGenerator
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
    public $name = 'video iFDO report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'video_ifdo_report';

    /**
     * Get sources for the sub-reports that should be generated for this project.
     *
     * @return mixed
     */
    public function getProjectSources()
    {
        $volumes = parent::getProjectSources()
            ->filter(fn ($v) => $v->metadata_parser === VideoIfdoParser::class);

        if ($volumes->isEmpty()) {
            throw new Exception('No volume with iFDO found for this project.');
        }

        return $volumes;
    }
}
