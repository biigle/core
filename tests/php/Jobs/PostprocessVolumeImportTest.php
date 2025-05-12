<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\PostprocessVolumeImport;
use Biigle\Jobs\ProcessAnnotatedImage;
use Biigle\Jobs\ProcessAnnotatedVideo;
use Biigle\Jobs\ProcessNewVolumeFiles;
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
        $annotation = ImageAnnotationTest::create();
        $job = new PostprocessVolumeImport(collect([$annotation->image->volume]));
        $job->handle();
        // One job for the creation of the annotation and one job by
        // PostprocessVolumeImport.
        $this->assertCount(2, Queue::pushed(ProcessAnnotatedImage::class));
    }

    public function testHandleVideoAnnotationPatches()
    {
        $annotation = VideoAnnotationTest::create();
        $job = new PostprocessVolumeImport(collect([$annotation->video->volume]));
        $job->handle();
        // One job for the creation of the annotation and one job by
        // PostprocessVolumeImport.
        $this->assertCount(2, Queue::pushed(ProcessAnnotatedVideo::class));
    }
}
