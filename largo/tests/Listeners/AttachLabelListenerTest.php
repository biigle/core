<?php

namespace Biigle\Tests\Modules\Largo\Listeners;

use Biigle\Events\AnnotationLabelAttached;
use Biigle\ImageAnnotationLabel;
use Biigle\Modules\Largo\Jobs\CopyImageAnnotationFeatureVector;
use Biigle\Modules\Largo\Jobs\CopyVideoAnnotationFeatureVector;
use Biigle\Modules\Largo\Listeners\AttachLabelListener;
use Biigle\VideoAnnotationLabel;
use Queue;
use TestCase;

class AttachLabelListenerTest extends TestCase
{
    public function testHandleImageAnnotationLabel()
    {
        $al = ImageAnnotationLabel::factory()->create();

        with(new AttachLabelListener)->handle(new AnnotationLabelAttached($al));

        Queue::assertPushed(function (CopyImageAnnotationFeatureVector $job) use ($al) {
            $this->assertSame($al, $job->annotationLabel);

            return true;
        });
    }

    public function testHandleVideoAnnotationLabel()
    {
        $al = VideoAnnotationLabel::factory()->create();

        with(new AttachLabelListener)->handle(new AnnotationLabelAttached($al));

        Queue::assertPushed(function (CopyVideoAnnotationFeatureVector $job) use ($al) {
            $this->assertSame($al, $job->annotationLabel);

            return true;
        });
    }
}
