<?php

use Copria\Transect;
use Dias\Modules\Ate\Listeners\ImagesCleanupListener;
use Dias\Modules\Ate\Jobs\RemoveAnnotationPatches;

class AteModuleListenersImagesCleanupListenerTest extends TestCase
{
    public function testHandleFail()
    {
        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        with(new ImagesCleanupListener)->handle([]);
        with(new ImagesCleanupListener)->handle(['abc']);
        with(new ImagesCleanupListener)->handle([1]);
    }

    public function testHandle()
    {
        $image = ImageTest::create();
        $this->expectsJobs(RemoveAnnotationPatches::class);
        with(new ImagesCleanupListener)->handle([$image->id]);
    }
}
