<?php

namespace Biigle\Tests\Modules\Sync\Jobs;

use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\Modules\Sync\Jobs\PostprocessVolumeImport;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoAnnotationTest;
use Queue;
use TestCase;

class PostprocessVolumeImportTest extends TestCase
{
    public function testHandleVolumeImages()
    {
        $image = ImageTest::create();
        $job = new PostprocessVolumeImport(collect([$image->volume]));
        $job->handle();
        Queue::assertPushed(ProcessNewVolumeFiles::class);
        Queue::assertNotPushed(ProcessAnnotatedImage::class);
    }

    public function testHandleImageAnnotationPatches()
    {
        if (!class_exists(ProcessAnnotatedImage::class)) {
            $this->markTestSkipped('Requires '.ProcessAnnotatedImage::class);
        }

        $annotation = ImageAnnotationTest::create();
        $job = new PostprocessVolumeImport(collect([$annotation->image->volume]));
        $job->handle();
        // One job for the creation of the annotation and one job by
        // PostprocessVolumeImport.
        $this->assertCount(2, Queue::pushed(ProcessAnnotatedImage::class));
    }

    public function testHandleVideoAnnotationPatches()
    {
        if (!class_exists(ProcessAnnotatedVideo::class)) {
            $this->markTestSkipped('Requires '.ProcessAnnotatedVideo::class);
        }

        $annotation = VideoAnnotationTest::create();
        $job = new PostprocessVolumeImport(collect([$annotation->video->volume]));
        $job->handle();
        // One job for the creation of the annotation and one job by
        // PostprocessVolumeImport.
        $this->assertCount(2, Queue::pushed(ProcessAnnotatedVideo::class));
    }
}
