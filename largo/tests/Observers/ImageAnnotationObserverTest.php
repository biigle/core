<?php

namespace Biigle\Tests\Modules\Largo\Observers;

use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\RemoveImageAnnotationPatches;
use Biigle\Tests\ImageAnnotationTest;
use TestCase;
use Queue;

class ImageAnnotationObserverTest extends TestCase
{
    public function testDeleting()
    {
        $annotation = ImageAnnotationTest::create();
        $annotation->delete();
        Queue::assertPushed(RemoveImageAnnotationPatches::class);
    }

    public function testCreated()
    {
        $annotation = ImageAnnotationTest::create();
        Queue::assertPushed(ProcessAnnotatedImage::class);
    }

    public function testSaved()
    {
        $annotation = ImageAnnotationTest::create();
        $annotation->save();
        Queue::assertPushed(ProcessAnnotatedImage::class);
    }
}
