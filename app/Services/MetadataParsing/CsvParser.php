<?php

namespace Biigle\Services\MetadataParsing;

use duncan3dc\Bom\Util;
use SeekableIterator;
use SplFileObject;

abstract class CsvParser extends MetadataParser
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
    public static function getKnownMimeTypes(): array
    {
        return [
            'text/plain',
            'text/csv',
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function recognizesFile(): bool
    {
        $file = $this->getCsvIterator();
        $line = $file->current();
        if (!is_array($line) || empty($line)) {
            return false;
        }

        if (mb_detect_encoding($line[0], 'UTF-8', true) === false) {
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
    abstract public function getMetadata(): VolumeMetadata;

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

    protected function getKeyMap(array $line): array
    {
        $line = $this->processFirstLine($line);

        $keys = array_map(function ($column) {
            if (array_key_exists($column, self::COLUMN_SYNONYMS)) {
                return self::COLUMN_SYNONYMS[$column];
            }

            return $column;
        }, $line);

        // This will remove duplicate columns and retain the "last" one.
        return array_flip($keys);
    }

    /**
     * Cast the value to float if it is not null or an empty string.
     */
    protected function maybeCastToFloat(?string $value): ?float
    {
        return (is_null($value) || $value === '') ? null : floatval($value);
    }
}
