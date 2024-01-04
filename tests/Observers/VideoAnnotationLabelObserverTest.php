<?php

namespace Biigle\Tests\Modules\Largo\Observers;

use Biigle\Modules\Largo\Jobs\CopyVideoAnnotationFeatureVector;
use Biigle\Tests\VideoAnnotationLabelTest;
use TestCase;
use Queue;

class VideoAnnotationLabelObserverTest extends TestCase
{
    public function testSaved()
    {
        $annotation = VideoAnnotationLabelTest::create();
        Queue::assertPushed(CopyVideoAnnotationFeatureVector::class);
    }
}
