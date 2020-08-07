<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use Biigle\Modules\Sync\Support\Export\VideoExport;
use Biigle\Tests\VideoTest;
use File;
use SplFileObject;
use TestCase;

class VideoExportTest extends TestCase
{
    public function testGetContent()
    {
        $video = VideoTest::create();
        $export = new VideoExport([$video->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $file->fgetcsv();
        $expect = [
            "{$video->id}",
            "{$video->filename}",
            "{$video->volume_id}",
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }

    public function testCleanUp()
    {
        $video = VideoTest::create();
        $export = new VideoExport([$video->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(File::exists($path));
        $export->getArchive();
        $this->assertFalse(File::exists($path));
    }
}
