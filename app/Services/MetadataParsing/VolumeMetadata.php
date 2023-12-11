<?php

namespace Biigle\Services\MetadataParsing;

use Biigle\MediaType;
use Illuminate\Support\Collection;

class VolumeMetadata
{
    public Collection $files;

    public function __construct(
        public ?MediaType $type = null,
        public ?string $name = null,
        public ?string $url = null,
        public ?string $handle = null
    )
    {
        $this->files = collect([]);
    }

    public function addFile(FileMetadata $file)
    {
        $this->files[$file->name] = $file;
    }

    public function getFiles(): Collection
    {
        return $this->files->values();
    }

    /**
     * Determine if there is any file metadata.
     */
    public function isEmpty(): bool
    {
        foreach ($this->files as $file) {
            if (!$file->isEmpty()) {
                return false;
            }
        }

        return true;
    }
}
