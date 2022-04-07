<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\Ifdo;

use Biigle\Modules\Reports\Support\Reports\Projects\ProjectVideoReportGenerator;
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
    protected $name = 'video iFDO report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    protected $filename = 'video_ifdo_report';

    /**
     * Get sources for the sub-reports that should be generated for this project.
     *
     * @return mixed
     */
    public function getProjectSources()
    {
        $volumes = parent::getProjectSources()->filter(function ($volume) {
            return $volume->hasIfdo();
        });

        if ($volumes->isEmpty()) {
            throw new Exception('No volume with iFDO found for this project.');
        }

        return $volumes;
    }
}
