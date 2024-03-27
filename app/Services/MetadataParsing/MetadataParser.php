<?php

namespace Biigle\Services\MetadataParsing;

use SplFileInfo;
use SplFileObject;

abstract class MetadataParser
{
    public SplFileObject $fileObject;

    /**
     * Get the MIME types that files known by this parser can have.
     *
     * Example: ['text/csv']
     */
    abstract public static function getKnownMimeTypes(): array;

    public function __construct(public SplFileInfo $file)
    {
        //
    }

    /**
     * Returns true if the file is in the format understood by the parser.
     */
    abstract public function recognizesFile(): bool;

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
