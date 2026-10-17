<?php

namespace Biigle\Services\Reports\Volumes;

use Biigle\Services\Reports\CsvFile;

class ImageMetadataReportGenerator extends VolumeReportGenerator
{
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

    /**
     * File extension of the report file.
     *
     * @var string
     */
    public $extension = 'csv';

    /**
     * Generate the report.
     *
     * @param string $path Path to the report file that should be generated
     */
    public function generateReport($path)
    {
        $csv = new CsvFile($path);
        $csv->putCsv([
            'image_id',
            'uuid',
            'volume_id',
            'filename',
            'taken_at',
            'longitude',
            'latitude',
            'width',
            'height',
            'file_size',
            'mime_type',
            'tiled',
            'tiling_in_progress',
            'gps_altitude',
            'distance_to_ground',
            'area',
            'yaw',
        ]);

        $this->source->images()->orderBy('id')->each(function ($image) use ($csv) {
            $metadata = $image->metadata;
            $csv->putCsv([
                $image->id,
                $image->uuid,
                $image->volume_id,
                $image->filename,
                $image->taken_at,
                $image->lng,
                $image->lat,
                $image->width,
                $image->height,
                $image->size,
                $image->mimeType,
                (int) $image->tiled,
                (int) $image->tilingInProgress,
                $metadata['gps_altitude'] ?? null,
                $metadata['distance_to_ground'] ?? null,
                $metadata['area'] ?? $image->attrs['laserpoints']['area'] ?? null,
                $metadata['yaw'] ?? null,
            ]);
        });

        $csv->close();
    }
}
