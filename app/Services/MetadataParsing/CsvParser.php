<?php

namespace Biigle\Services\MetadataParsing;

use duncan3dc\Bom\Util;
use SeekableIterator;
use SplFileObject;
use SplTempFileObject;

abstract class CsvParser extends MetadataParser
{
    /**
     * Number of bytes that are read at once to detect and convert line endings.
     *
     * @var int
     */
    const CHUNK_SIZE = 8192;

    /**
     * The file object that is used to read the CSV.
     *
     * This is a copy of the original file with converted line endings if the
     * original file has classic Mac OS line endings.
     */
    protected SplFileObject $csvFileObject;

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
    public static function getName(): string
    {
        return 'BIIGLE CSV';
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
        if (!isset($this->csvFileObject)) {
            $file = $this->getFileObject();
            if ($this->hasClassicMacLineEndings($file)) {
                $file = $this->convertLineEndings($file);
            }

            $this->csvFileObject = $file;
        }

        $this->csvFileObject->setFlags(SplFileObject::READ_CSV);

        return $this->csvFileObject;
    }

    /**
     * Determine if the file uses classic Mac OS line endings ("\r"). These are not
     * recognized as line endings by SplFileObject. The decision is based on the
     * first line ending of the file.
     */
    protected function hasClassicMacLineEndings(SplFileObject $file): bool
    {
        $file->rewind();
        $carry = '';
        $result = false;

        while (!$file->eof()) {
            $chunk = $carry.$file->fread(static::CHUNK_SIZE);
            $carry = '';
            $position = strcspn($chunk, "\r\n");

            if ($position === strlen($chunk)) {
                // No line ending in this chunk.
                continue;
            }

            if ($chunk[$position] === "\n") {
                break;
            }

            if ($position === strlen($chunk) - 1) {
                // The "\r" may be followed by a "\n" in the next chunk.
                $carry = "\r";
                continue;
            }

            $result = $chunk[$position + 1] !== "\n";
            break;
        }

        $file->rewind();

        // A "\r" at the very end of the file is the first line ending in this case.
        return $result || $carry === "\r";
    }

    /**
     * Create a temporary copy of the file with "\r" and "\r\n" line endings
     * converted to "\n".
     */
    protected function convertLineEndings(SplFileObject $file): SplFileObject
    {
        $copy = new SplTempFileObject;
        $file->rewind();
        $carry = '';

        while (!$file->eof()) {
            $chunk = $carry.$file->fread(static::CHUNK_SIZE);
            // Keep a trailing "\r" for the next chunk because it may be followed by
            // a "\n".
            $carry = str_ends_with($chunk, "\r") ? "\r" : '';
            $chunk = substr($chunk, 0, strlen($chunk) - strlen($carry));
            $copy->fwrite(preg_replace("/\r\n?/", "\n", $chunk));
        }

        $copy->fwrite(str_replace("\r", "\n", $carry));
        $file->rewind();
        $copy->rewind();

        return $copy;
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
