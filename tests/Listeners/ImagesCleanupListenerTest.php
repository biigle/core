<?php

namespace Biigle\Tests\Modules\Ate\Listeners;

use TestCase;
use Copria\Transect;
use Biigle\Tests\ImageTest;
use Faker\Factory as Faker;
use Illuminate\Database\QueryException;
use Biigle\Modules\Ate\Jobs\RemoveAnnotationPatches;
use Biigle\Modules\Ate\Listeners\ImagesCleanupListener;

class AteModuleListenersImagesCleanupListenerTest extends TestCase
{
    public function testHandleEmpty()
    {
        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        with(new ImagesCleanupListener)->handle([]);
    }

    public function testHandleMalformed()
    {
        if ($this->isSqlite()) {
            $this->markTestSkipped('SQLite does not have an explicit UUID datatype.');
        }
        $this->setExpectedException(QueryException::class);
        with(new ImagesCleanupListener)->handle(['abc']);
    }

    public function testNotThere()
    {
        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        $faker = Faker::create();
        with(new ImagesCleanupListener)->handle([$faker->uuid()]);
    }

    public function testHandle()
    {
        $image = ImageTest::create();
        $this->expectsJobs(RemoveAnnotationPatches::class);
        with(new ImagesCleanupListener)->handle([$image->uuid]);
    }
}
