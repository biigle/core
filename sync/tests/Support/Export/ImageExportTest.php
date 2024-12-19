<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use Biigle\Modules\Sync\Support\Export\ImageExport;
use Biigle\Tests\ImageTest;
use File;
use SplFileObject;
use TestCase;

class ImageExportTest extends TestCase
{
    public function testGetContent()
    {
        $image = ImageTest::create();
        $export = new ImageExport([$image->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $file->fgetcsv();
        $expect = [
            "{$image->id}",
            "{$image->filename}",
            "{$image->volume_id}",
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }

    public function testCleanUp()
    {
        $image = ImageTest::create();
        $export = new ImageExport([$image->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(File::exists($path));
        $export->getArchive();
        $this->assertFalse(File::exists($path));
    }
}
