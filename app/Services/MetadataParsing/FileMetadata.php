<?php

namespace Biigle\Services\MetadataParsing;

class FileMetadata
{
    /**
     * @var array<ImageAnnotation>
     */
    public array $annotations = [];

    public function __construct(public string $name)
    {
        $this->name = trim($this->name);
    }

    public function isEmpty(): bool
    {
        return true;
    }

    /**
     * Get the array of metadata that can be used for Model::insert();
     */
    public function getInsertData(): array
    {
        return [];
    }

    public function addAnnotation(Annotation $annotation): void
    {
        $this->annotations[] = $annotation;
    }

    public function getAnnotations(): array
    {
        return $this->annotations;
    }

    public function hasAnnotations(): bool
    {
        return !empty($this->annotations);
    }
}
