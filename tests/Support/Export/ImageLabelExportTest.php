<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use File;
use TestCase;
use SplFileObject;
use Biigle\Tests\ImageLabelTest;
use Biigle\Modules\Sync\Support\Export\ImageLabelExport;

class ImageLabelExportTest extends TestCase
{
    public function testGetContent()
    {
        $label = ImageLabelTest::create();
        $export = new ImageLabelExport([$label->image->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
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
