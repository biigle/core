<?php

namespace Biigle\Services\MetadataParsers;

use SplFileObject;
use Symfony\Component\HttpFoundation\File\File;

abstract class MetadataParser
{
    public SplFileObject $fileObject;

    public function __construct(public File $file)
    {
        //
    }

    /**
     * Returns true if the file is in the format understood by the parser.
     */
    abstract public function recognizesFile(): bool;

    /**
     * @throws ValidationException
     */
    abstract public function validateFile(): void;

    protected function getFileObject(): SplFileObject
    {
        if (!isset($this->fileObject)) {
            $this->fileObject = $this->file->openFile();
        }

        return $this->fileObject;
    }
}
