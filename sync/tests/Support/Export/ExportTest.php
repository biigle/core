<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use Biigle\Modules\Sync\Support\Export\Export;
use File;
use TestCase;
use ZipArchive;

class ExportTest extends TestCase
{
    public function testGetArchive()
    {
        $export = new ExportStub([]);
        $path = $export->getArchive();
        try {
            $zip = new ZipArchive;
            $zip->open($path);
            $content = $zip->getFromName('data.json');
            $this->assertEquals(['test'], json_decode($content));
        } finally {
            File::delete($path);
        }
    }
}

class ExportStub extends Export
{
    public function getContent()
    {
        return ['test'];
    }
}
