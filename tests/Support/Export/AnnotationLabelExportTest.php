<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use File;
use TestCase;
use SplFileObject;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Modules\Sync\Support\Export\AnnotationLabelExport;

class AnnotationLabelExportTest extends TestCase
{
    public function testGetContent()
    {
        $label = AnnotationLabelTest::create();
        $export = new AnnotationLabelExport([$label->annotation->image->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $expect = [
            "{$label->annotation_id}",
            "{$label->label_id}",
            "{$label->user_id}",
            "{$label->confidence}",
            "{$label->created_at}",
            "{$label->updated_at}",
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }

    public function testCleanUp()
    {
        $label = AnnotationLabelTest::create();
        $export = new AnnotationLabelExport([$label->annotation->image->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(File::exists($path));
        $export->getArchive();
        $this->assertFalse(File::exists($path));
    }
}
