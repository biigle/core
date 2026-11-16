<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\MetadataParser;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use TypeError;

/**
 * A metadata parser that throws an error when it tries to recognize a file. This
 * simulates a parser that does not handle all kinds of invalid files.
 */
class ErrorParserStub extends MetadataParser
{
    public static function getKnownMimeTypes(): array
    {
        return ['text/plain', 'text/csv', 'application/json'];
    }

    public static function getName(): string
    {
        return 'Error parser';
    }

    public function recognizesFile(): bool
    {
        throw new TypeError('Argument #1 ($data) must be of type array, null given');
    }

    public function getMetadata(): VolumeMetadata
    {
        return new VolumeMetadata;
    }
}
