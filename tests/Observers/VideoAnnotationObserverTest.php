<?php

namespace Biigle\Tests\Modules\Largo\Observers;

use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\Modules\Largo\Jobs\RemoveVideoAnnotationPatches;
use Biigle\Tests\VideoAnnotationTest;
use TestCase;
use Queue;

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
