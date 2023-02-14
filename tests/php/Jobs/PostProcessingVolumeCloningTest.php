<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\PostProcessingVolumeCloning;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\MediaType;
use Biigle\Modules\Largo\Jobs\GenerateImageAnnotationPatch;
use Biigle\Modules\Largo\Jobs\GenerateVideoAnnotationPatch;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Queue;
use TestCase;

class PostProcessingVolumeCloningTest extends TestCase
{
    public function testHandleVolumeImages()
    {
        $copy = VolumeTest::create();
        ImageTest::create(['volume_id' => $copy->id]);
        $job = new PostProcessingVolumeCloning($copy);
        $job->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);
        Queue::assertNotPushed(GenerateImageAnnotationPatch::class);
    }

    public function testHandleImageAnnotationPatches()
    {
        if (!class_exists(GenerateImageAnnotationPatch::class)) {
            $this->markTestSkipped('Requires '.GenerateImageAnnotationPatch::class);
        }

        $copy = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $copy->id]);
        ImageAnnotationTest::create(['image_id' => $image->id]);
        $job = new PostProcessingVolumeCloning($copy);
        $job->handle();
        // One job for the creation of the annotation and one job by
        // PostprocessVolumeCloning.
        Queue::assertPushed(ProcessNewVolumeFiles::class);
        Queue::assertPushed(GenerateImageAnnotationPatch::class);
    }

    public function testHandleVideoAnnotationPatches()
    {
        if (!class_exists(GenerateVideoAnnotationPatch::class)) {
            $this->markTestSkipped('Requires '.GenerateVideoAnnotationPatch::class);
        }
        $copy = VolumeTest::create(['media_type_id' => MediaType::videoId()])->fresh();
        $video = VideoTest::create(['volume_id' => $copy->id]);
        VideoAnnotationTest::create(['video_id' => $video->id]);
        $job = new PostProcessingVolumeCloning($copy);
        $job->handle();
        // One job for the creation of the annotation and one job by
        // PostprocessVolumeCloning.
        Queue::assertPushed(ProcessNewVolumeFiles::class);
        Queue::assertPushed(GenerateVideoAnnotationPatch::class);
    }

}
