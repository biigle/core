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
    ) {
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

    public function getFile(string $name): ?FileMetadata
    {
        return $this->files->get($name);
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

    public function hasAnnotations(): bool
    {
        foreach ($this->files as $file) {
            if ($file->hasAnnotations()) {
                return true;
            }
        }

        return false;
    }

    public function hasFileLabels(): bool
    {
        foreach ($this->files as $file) {
            if ($file->hasFileLabels()) {
                return true;
            }
        }

        return false;
    }

    /**
     * The returned array is indexed by label IDs.
     */
    public function getAnnotationLabels(): array
    {
        $labels = [];

        foreach ($this->files as $file) {
            // Use union to automatically remove duplicates.
            $labels += $file->getAnnotationLabels();
        }

        return $labels;
    }

    /**
     * The returned array is indexed by label IDs.
     */
    public function getFileLabels(): array
    {
        $labels = [];

        foreach ($this->files as $file) {
            foreach ($file->getFileLabels() as $fileLabel) {
                $labels[$fileLabel->label->id] = $fileLabel->label;
            }
        }

        return $labels;
    }
}
