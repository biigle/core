<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\MediaType;

class ImageCsvParser extends CsvParser
{
    /**
     * {@inheritdoc}
     */
    public function getMetadata(): VolumeMetadata
    {
        $data = new VolumeMetadata(MediaType::image());

        $file = $this->getCsvIterator();
        $line = $file->current();
        if (!is_array($line)) {
            return $data;
        }

        $keyMap = $this->getKeyMap($line);

        $getValue = fn ($row, $key) => $row[$keyMap[$key] ?? null] ?? null;

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
                lat: $this->maybeCastToFloat($getValue($row, 'lat')),
                lng: $this->maybeCastToFloat($getValue($row, 'lng')),
                takenAt: $getValue($row, 'taken_at') ?: null, // Use null instead of ''.
                area: $this->maybeCastToFloat($getValue($row, 'area')),
                distanceToGround: $this->maybeCastToFloat($getValue($row, 'distance_to_ground')),
                gpsAltitude: $this->maybeCastToFloat($getValue($row, 'gps_altitude')),
                yaw: $this->maybeCastToFloat($getValue($row, 'yaw')),
            );

            $data->addFile($fileData);
        }

        return $data;
    }
}
