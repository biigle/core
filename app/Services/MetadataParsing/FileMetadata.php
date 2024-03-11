<?php

namespace Biigle\Services\MetadataParsing;

class FileMetadata
{
    public function __construct(public string $name)
    {
        //
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
}
