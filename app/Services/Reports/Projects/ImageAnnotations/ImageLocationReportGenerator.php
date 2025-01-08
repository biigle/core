<?php

namespace Biigle\Services\Reports\Projects\ImageAnnotations;

use Biigle\Services\Reports\Volumes\ImageAnnotations\ImageLocationReportGenerator as ReportGenerator;
use DB;

class ImageLocationReportGenerator extends AnnotationReportGenerator
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
    public $name = 'image location image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'image_location_image_annotation_report';

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
