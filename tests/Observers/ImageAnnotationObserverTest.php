<?php

namespace Biigle\Tests\Modules\Largo\Observers;

use Biigle\Modules\Largo\Jobs\GenerateImageAnnotationPatch;
use Biigle\Modules\Largo\Jobs\RemoveImageAnnotationPatches;
use Biigle\Tests\ImageAnnotationTest;
use TestCase;

class ImageAnnotationObserverTest extends TestCase
{
    public function testDeleting()
    {
        $annotation = ImageAnnotationTest::create();
        $this->expectsJobs(RemoveImageAnnotationPatches::class);
        $annotation->delete();
    }

    public function testCreated()
    {
        $this->expectsJobs(GenerateImageAnnotationPatch::class);
        $annotation = ImageAnnotationTest::create();
    }

    public function testSaved()
    {
        $annotation = ImageAnnotationTest::create();
        $this->expectsJobs(GenerateImageAnnotationPatch::class);
        $annotation->save();
    }
}
