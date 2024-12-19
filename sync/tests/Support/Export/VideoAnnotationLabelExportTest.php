<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use Biigle\Modules\Sync\Support\Export\VideoAnnotationLabelExport;
use Biigle\Tests\VideoAnnotationLabelTest;
use File;
use SplFileObject;
use TestCase;

class VideoAnnotationLabelExportTest extends TestCase
{
    public function testGetContent()
    {
        $label = VideoAnnotationLabelTest::create();
        $export = new VideoAnnotationLabelExport([$label->annotation->video->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $file->fgetcsv();
        $expect = [
            "{$label->annotation_id}",
            "{$label->label_id}",
            "{$label->user_id}",
            "{$label->created_at}",
            "{$label->updated_at}",
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }

    public function testCleanUp()
    {
        $label = VideoAnnotationLabelTest::create();
        $export = new VideoAnnotationLabelExport([$label->annotation->video->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(File::exists($path));
        $export->getArchive();
        $this->assertFalse(File::exists($path));
    }
}
