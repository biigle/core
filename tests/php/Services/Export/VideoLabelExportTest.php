<?php

namespace Biigle\Tests\Services\Export;

use Biigle\Services\Export\VideoLabelExport;
use Biigle\Tests\VideoLabelTest;
use File;
use SplFileObject;
use TestCase;

class VideoLabelExportTest extends TestCase
{
    public function testGetContent()
    {
        $label = VideoLabelTest::create();
        $export = new VideoLabelExport([$label->video->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(is_string($path));
        $file = new SplFileObject($path);
        $file->fgetcsv();
        $expect = [
            "{$label->video_id}",
            "{$label->label_id}",
            "{$label->user_id}",
            "{$label->created_at}",
            "{$label->updated_at}",
        ];
        $this->assertEquals($expect, $file->fgetcsv());
    }

    public function testCleanUp()
    {
        $label = VideoLabelTest::create();
        $export = new VideoLabelExport([$label->video->volume_id]);

        $path = $export->getContent();
        $this->assertTrue(File::exists($path));
        $export->getArchive();
        $this->assertFalse(File::exists($path));
    }
}
