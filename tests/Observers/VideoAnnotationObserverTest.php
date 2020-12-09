<?php

namespace Biigle\Tests\Modules\Largo\Observers;

use Biigle\Modules\Largo\Jobs\GenerateVideoAnnotationPatch;
use Biigle\Modules\Largo\Jobs\RemoveVideoAnnotationPatches;
use Biigle\Tests\VideoAnnotationTest;
use TestCase;

class VideoAnnotationObserverTest extends TestCase
{
    public function testDeleting()
    {
        $annotation = VideoAnnotationTest::create();
        $this->expectsJobs(RemoveVideoAnnotationPatches::class);
        $annotation->delete();
    }

    public function testCreated()
    {
        $this->expectsJobs(GenerateVideoAnnotationPatch::class);
        $annotation = VideoAnnotationTest::create();
    }

    public function testSaved()
    {
        $annotation = VideoAnnotationTest::create();
        $this->expectsJobs(GenerateVideoAnnotationPatch::class);
        $annotation->save();
    }
}
