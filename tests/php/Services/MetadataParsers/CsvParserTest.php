<?php

namespace Biigle\Tests\Services\MetadataParsers;

use Biigle\Services\MetadataParsers\CsvParser;
use Symfony\Component\HttpFoundation\File\File;
use TestCase;

class CsvParserTest extends TestCase
{
    public function testRecognizesFile()
    {
        $file = new File(__DIR__."/../../../files/image-metadata.csv");
        $parser = new CsvParser($file);
        $this->assertTrue($parser->recognizesFile());
    }

    public function testValidateFile()
    {
        //
    }
}
