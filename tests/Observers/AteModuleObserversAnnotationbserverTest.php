<?php

use Dias\Modules\Ate\Jobs\RemoveAnnotationPatches;
use Dias\Modules\Ate\Jobs\GenerateAnnotationPatch;

class AteModuleObserversAnnotationObserverTest extends TestCase
{
    public function testDeleting()
    {
        $annotation = AnnotationTest::create();
        $this->expectsJobs(RemoveAnnotationPatches::class);
        $annotation->delete();
    }

    public function testCreated()
    {
        $this->expectsJobs(GenerateAnnotationPatch::class);
        $annotation = AnnotationTest::create();
    }

    public function testSaved()
    {
        $annotation = AnnotationTest::create();
        $this->expectsJobs(GenerateAnnotationPatch::class);
        $annotation->save();
    }
}
