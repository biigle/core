<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\MediaType;
use duncan3dc\Bom\Util;
use SeekableIterator;
use SplFileObject;
use Symfony\Component\HttpFoundation\File\File;

class ImageCsvParser extends MetadataParser
{
    /**
     * Column name synonyms.
     *
     * @var array
     */
    const COLUMN_SYNONYMS = [
        'file' => 'filename',
        'lon' => 'lng',
        'longitude' => 'lng',
        'latitude' => 'lat',
        'heading' => 'yaw',
        'sub_datetime' => 'taken_at',
        'sub_longitude' => 'lng',
        'sub_latitude' => 'lat',
        'sub_heading' => 'yaw',
        'sub_distance' => 'distance_to_ground',
        'sub_altitude' => 'gps_altitude',
    ];

    /**
     * {@inheritdoc}
     */
    public function recognizesFile(): bool
    {
        $file = $this->getCsvIterator();
        $line = $file->current();
        if (!is_array($line)) {
            return false;
        }

        $line = $this->processFirstLine($line);

        if (!in_array('filename', $line, true) && !in_array('file', $line, true)) {
            return false;
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function getMetadata(): VolumeMetadata
    {
        $data = new VolumeMetadata(MediaType::image());

        $file = $this->getCsvIterator();
        $keys = $file->current();
        if (!is_array($keys)) {
            return $data;
        }

        $keys = $this->processFirstLine($keys);
        $keys = array_map(function ($column) {
            if (array_key_exists($column, self::COLUMN_SYNONYMS)) {
                return self::COLUMN_SYNONYMS[$column];
            }

            return $column;
        }, $keys);

        $keyMap = array_flip($keys);
        $getValue = fn ($row, $key) => $row[$keyMap[$key] ?? null] ?? null;
        $maybeCast = fn ($value) => (is_null($value) || $value === '') ? null : floatval($value);

        $file->next();
        while ($file->valid()) {
            $row = $file->current();
            $file->next();
            if (empty($row)) {
                continue;
            }

            $name = $getValue($row, 'filename');
            if (empty($name)) {
                continue;
            }

            $fileData = new ImageMetadata(
                name: $getValue($row, 'filename'),
                lat: $maybeCast($getValue($row, 'lat')),
                lng: $maybeCast($getValue($row, 'lng')),
                takenAt: $getValue($row, 'taken_at') ?: null, // Use null instead of ''.
                area: $maybeCast($getValue($row, 'area')),
                distanceToGround: $maybeCast($getValue($row, 'distance_to_ground')),
                gpsAltitude: $maybeCast($getValue($row, 'gps_altitude')),
                yaw: $maybeCast($getValue($row, 'yaw')),
            );

            $data->addFile($fileData);
        }

        return $data;
    }

    protected function getCsvIterator(): SeekableIterator
    {
        $file = parent::getFileObject();
        $file->setFlags(SplFileObject::READ_CSV);

        return $file;
    }

    protected function processFirstLine(array $line): array
    {
        $line = array_map('strtolower', $line);
        if (!empty($line[0])) {
            $line[0] = Util::removeBom($line[0]);
        }

        return $line;
    }
}
