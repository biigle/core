<?php

namespace Biigle\Tests\Observers;

use Biigle\Jobs\ProcessAnnotatedVideo;
use Biigle\Jobs\RemoveVideoAnnotationPatches;
use Biigle\Tests\VideoAnnotationTest;
use Queue;
use TestCase;

class VideoAnnotationObserverTest extends TestCase
{
    public function testDeleting()
    {
        $annotation = VideoAnnotationTest::create();
        $annotation->delete();
        Queue::assertPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testCreated()
    {
        $annotation = VideoAnnotationTest::create();
        Queue::assertPushed(ProcessAnnotatedVideo::class);
    }

    public function testSaved()
    {
        $annotation = VideoAnnotationTest::create();
        $annotation->save();
        Queue::assertPushed(ProcessAnnotatedVideo::class);
    }
}
