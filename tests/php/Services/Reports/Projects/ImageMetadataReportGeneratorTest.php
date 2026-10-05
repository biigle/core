<?php

namespace Biigle\Tests\Services\Reports\Projects;

use Biigle\MediaType;
use Biigle\Services\Reports\Projects\ImageMetadataReportGenerator;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use TestCase;
use ZipArchive;

class ImageMetadataReportGeneratorTest extends TestCase
{
    public function testGenerateReportContainsOneCsvPerImageVolume()
    {
        $project = ProjectTest::create();
        $first = VolumeTest::create(['media_type_id' => MediaType::imageId()]);
        $second = VolumeTest::create(['media_type_id' => MediaType::imageId()]);
        $video = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $project->volumes()->attach([$first->id, $second->id, $video->id]);
        ImageTest::create(['volume_id' => $first->id]);
        ImageTest::create(['volume_id' => $second->id]);

        $path = (new ImageMetadataReportGenerator)->generate($project);
        $zip = new ZipArchive;
        $zip->open($path);
        $files = [];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $files[] = $zip->getNameIndex($i);
        }

        sort($files);
        $this->assertSame([
            "{$first->id}_image_metadata_report.csv",
            "{$second->id}_image_metadata_report.csv",
        ], $files);

        $zip->close();
        unlink($path);
    }
}
