<?php

namespace Biigle\Tests\Listeners;

use Biigle\Events\AnnotationLabelAttached;
use Biigle\ImageAnnotationLabel;
use Biigle\Jobs\CopyImageAnnotationFeatureVector;
use Biigle\Jobs\CopyVideoAnnotationFeatureVector;
use Biigle\Listeners\AttachLabelListener;
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
