<?php

namespace Biigle\Services\MetadataParsers;

use SplFileObject;
use Symfony\Component\HttpFoundation\File\File;

class CsvParser extends MetadataParser
{
    /**
     * {@inheritdoc}
     */
    public function recognizesFile(): bool
    {
        $file = $this->getFileObject();
        $line = $file->current();
        if (!is_array($line)) {
            return false;
        }

        $line = array_map('strtolower', $line);

        if (!in_array('filename', $line, true) && !in_array('file', $line, true)) {
            return false;
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function validateFile(): void
    {
        //
    }

    protected function getFileObject(): SplFileObject
    {
        $file = parent::getFileObject();
        $file->setFlags(SplFileObject::READ_CSV);

        return $file;
    }
}
