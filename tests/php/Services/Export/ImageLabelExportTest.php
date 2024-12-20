<?php

namespace Biigle\Tests\Services\Export;

use Biigle\Services\Export\ImageLabelExport;
use Biigle\Tests\ImageLabelTest;
use File;
use SplFileObject;
use TestCase;

class ImageLabelExportTest extends TestCase
{
    public function testGetContent()
    {
        $label = ImageLabelTest::create();
        $export = new ImageLabelExport([$label->image->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $file->fgetcsv();
        $expect = [
            "{$label->image_id}",
            "{$label->label_id}",
            "{$label->user_id}",
            "{$label->created_at}",
            "{$label->updated_at}",
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }

    public function testCleanUp()
    {
        $label = ImageLabelTest::create();
        $export = new ImageLabelExport([$label->image->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(File::exists($path));
        $export->getArchive();
        $this->assertFalse(File::exists($path));
    }
}
