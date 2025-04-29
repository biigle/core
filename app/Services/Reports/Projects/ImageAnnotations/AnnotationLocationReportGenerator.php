<?php

namespace Biigle\Services\Reports\Projects\ImageAnnotations;

use Biigle\Services\Reports\Volumes\ImageAnnotations\AnnotationLocationReportGenerator as ReportGenerator;
use DB;

class AnnotationLocationReportGenerator extends AnnotationReportGenerator
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
    public $name = 'annotation location image annotation report';

    /**
     * Name of the report for use as (part of) a filename.
     *
     * @var string
     */
    public $filename = 'annotation_location_image_annotation_report';

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
                    ->whereNotNull('images.lng')
                    ->whereNotNull('images.attrs->width')
                    ->whereNotNull('images.attrs->height')
                    ->whereNotNull('images.attrs->metadata->yaw')
                    ->whereNotNull('images.attrs->metadata->distance_to_ground');
            })
            ->get();
    }
}
