<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use File;
use TestCase;
use SplFileObject;
use Biigle\Tests\AnnotationTest;
use Biigle\Modules\Sync\Support\Export\AnnotationExport;

class AnnotationExportTest extends TestCase
{
    public function testGetContent()
    {
        $annotation = AnnotationTest::create();
        $export = new AnnotationExport([$annotation->image->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $file->fgetcsv();
        $expect = [
            "{$annotation->id}",
            "{$annotation->image_id}",
            "{$annotation->shape_id}",
            "{$annotation->created_at}",
            "{$annotation->updated_at}",
            json_encode($annotation->points),
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }

    public function testCleanUp()
    {
        $annotation = AnnotationTest::create();
        $export = new AnnotationExport([$annotation->image->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(File::exists($path));
        $export->getArchive();
        $this->assertFalse(File::exists($path));
    }
}
