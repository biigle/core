<?php

namespace Biigle\Modules\Reports\Support\Reports\Projects\ImageLabels;

use Biigle\Modules\Reports\Support\Reports\Projects\ProjectImageReportGenerator;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageLabels\ImageLocationReportGenerator as ReportGenerator;
use DB;

class ImageLocationReportGenerator extends ProjectImageReportGenerator
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
    public $name = 'image location image label report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'image_location_image_label_report';

    /**
     * Get sources for the sub-reports that should be generated for this project.
     *
     * @return mixed
     */
    public function getProjectSources()
    {
        return $this->source->imageVolumes()
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('images')
                    ->whereColumn('images.volume_id', 'volumes.id')
                    ->whereNotNull('images.lat')
                    ->whereNotNull('images.lng');
            })
            ->get();
    }
}
