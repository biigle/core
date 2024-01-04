<?php

namespace Biigle\Tests\Modules\Largo\Observers;

use Biigle\Modules\Largo\Jobs\CopyImageAnnotationFeatureVector;
use Biigle\Tests\ImageAnnotationLabelTest;
use TestCase;
use Queue;

class ImageAnnotationLabelObserverTest extends TestCase
{
    public function testSaved()
    {
        $annotation = ImageAnnotationLabelTest::create();
        Queue::assertPushed(CopyImageAnnotationFeatureVector::class);
    }
}
