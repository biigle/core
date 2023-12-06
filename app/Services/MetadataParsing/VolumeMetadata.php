<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\MediaType;

class VolumeMetadata
{
    public array $files;

    public function __construct(
        public ?MediaType $type = null,
        public ?string $name = null,
        public ?string $url = null,
        public ?string $handle = null
    )
    {
        $this->files = [];
    }

    public function addFile(FileMetadata $file)
    {
        $this->files[$file->name] = $file;
    }

    public function getFiles(): array
    {
        return array_values($this->files);
    }
}
