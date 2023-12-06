<?php

namespace Biigle\Services\MetadataParsers;

use duncan3dc\Bom\Util;
use SplFileObject;
use Symfony\Component\HttpFoundation\File\File;

class ImageCsvParser extends MetadataParser
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
        if (!empty($line[0])) {
            $line[0] = Util::removeBom($line[0]);
        }

        if (!in_array('filename', $line, true) && !in_array('file', $line, true)) {
            return false;
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function getMetadata(): VolumeMetadata;
    {

    }

    protected function getFileObject(): SplFileObject
    {
        $file = parent::getFileObject();
        $file->setFlags(SplFileObject::READ_CSV);

        return $file;
    }
}
