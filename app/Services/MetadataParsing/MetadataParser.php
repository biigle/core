<?php

namespace Biigle\Services\MetadataParsing;

use SplFileInfo;
use SplFileObject;
use Throwable;

abstract class MetadataParser
{
    public SplFileObject $fileObject;

    /**
     * Get the MIME types that files known by this parser can have.
     *
     * Example: ['text/csv']
     */
    abstract public static function getKnownMimeTypes(): array;

    /**
     * Get the name of the parser to show it to users selecting files.
     *
     * Example: 'BIIGLE CSV'
     */
    abstract public static function getName(): string;

    public function __construct(public SplFileInfo $file)
    {
        //
    }

    /**
     * Returns true if the file is in the format understood by the parser.
     */
    abstract public function recognizesFile(): bool;

    /**
     * Like recognizesFile() but returns false if the parser throws an error. This can
     * happen if a parser does not handle all kinds of invalid files.
     */
    final public function recognizesFileSafely(): bool
    {
        try {
            return $this->recognizesFile();
        } catch (Throwable $e) {
            return false;
        }
    }

    /**
     * Get a filled VolumeMetadata object based on the file.
     */
    abstract public function getMetadata(): VolumeMetadata;

    protected function getFileObject(): SplFileObject
    {
        if (!isset($this->fileObject)) {
            $this->fileObject = $this->file->openFile();
        }

        return $this->fileObject;
    }
}
