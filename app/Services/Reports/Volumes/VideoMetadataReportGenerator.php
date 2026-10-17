<?php

namespace Biigle\Services\Reports\Volumes;

use Biigle\Services\Reports\CsvFile;

class VideoMetadataReportGenerator extends VolumeReportGenerator
{
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
            'video_id',
            'uuid',
            'volume_id',
            'filename',
            'duration',
            'width',
            'height',
            'file_size',
            'mime_type',
            'error',
            'sample_index',
            'taken_at',
            'longitude',
            'latitude',
            'gps_altitude',
            'distance_to_ground',
            'area',
            'yaw',
        ]);

        $this->source->videos()->orderBy('id')->each(function ($video) use ($csv) {
            $metadata = $video->metadata;
            $samples = [
                $video->taken_at ?? [],
                $video->lng ?? [],
                $video->lat ?? [],
                $metadata['gps_altitude'] ?? [],
                $metadata['distance_to_ground'] ?? [],
                $metadata['area'] ?? [],
                $metadata['yaw'] ?? [],
            ];
            $sampleCount = max(array_map('count', $samples));
            $indices = $sampleCount === 0 ? [null] : range(0, $sampleCount - 1);

            foreach ($indices as $index) {
                $sample = fn ($values) => is_null($index) ? null : ($values[$index] ?? null);
                $csv->putCsv([
                    $video->id,
                    $video->uuid,
                    $video->volume_id,
                    $video->filename,
                    $video->duration,
                    $video->width,
                    $video->height,
                    $video->size,
                    $video->mimeType,
                    $video->error,
                    $index,
                    ...array_map($sample, $samples),
                ]);
            }
        });

        $csv->close();
    }
}
