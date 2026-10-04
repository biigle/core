<?php

namespace Biigle\Tests\Services\Reports\Projects;

use Biigle\MediaType;
use Biigle\Services\Reports\Projects\VideoMetadataReportGenerator;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use TestCase;
use ZipArchive;

class VideoMetadataReportGeneratorTest extends TestCase
{
    public function testGenerateReportContainsOneCsvPerVideoVolume()
    {
        $project = ProjectTest::create();
        $first = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $second = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $image = VolumeTest::create(['media_type_id' => MediaType::imageId()]);
        $project->volumes()->attach([$first->id, $second->id, $image->id]);
        VideoTest::create(['volume_id' => $first->id]);
        VideoTest::create(['volume_id' => $second->id]);

        $path = (new VideoMetadataReportGenerator)->generate($project);
        $zip = new ZipArchive;
        $zip->open($path);
        $files = [];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $files[] = $zip->getNameIndex($i);
        }

        sort($files);
        $this->assertSame([
            "{$first->id}_video_metadata_report.csv",
            "{$second->id}_video_metadata_report.csv",
        ], $files);

        $zip->close();
        unlink($path);
    }
}
