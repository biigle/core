<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use Biigle\Modules\Sync\Support\Export\VideoAnnotationExport;
use Biigle\Tests\VideoAnnotationTest;
use File;
use SplFileObject;
use TestCase;

class VideoAnnotationExportTest extends TestCase
{
    public function testGetContent()
    {
        $annotation = VideoAnnotationTest::create();
        $export = new VideoAnnotationExport([$annotation->video->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $file->fgetcsv();
        $expect = [
            "{$annotation->id}",
            "{$annotation->video_id}",
            "{$annotation->shape_id}",
            "{$annotation->created_at}",
            "{$annotation->updated_at}",
            json_encode($annotation->points),
            json_encode($annotation->frames),
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }

    public function testCleanUp()
    {
        $annotation = VideoAnnotationTest::create();
        $export = new VideoAnnotationExport([$annotation->video->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(File::exists($path));
        $export->getArchive();
        $this->assertFalse(File::exists($path));
    }
}
