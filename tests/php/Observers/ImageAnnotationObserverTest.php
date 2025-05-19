<?php

namespace Biigle\Tests\Observers;

use Biigle\Jobs\ProcessAnnotatedImage;
use Biigle\Jobs\RemoveImageAnnotationPatches;
use Biigle\Tests\ImageAnnotationTest;
use Queue;
use TestCase;

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
