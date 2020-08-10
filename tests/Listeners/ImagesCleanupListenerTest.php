<?php

namespace Biigle\Tests\Modules\Largo\Listeners;

use Biigle\Events\ImagesDeleted;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Modules\Largo\Listeners\ImagesCleanupListener;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Faker\Factory as Faker;
use Illuminate\Database\QueryException;
use TestCase;

class ImagesCleanupListenerTest extends TestCase
{
    public function testHandleEmpty()
    {
        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        with(new ImagesCleanupListener)->handle(new ImagesDeleted([]));
    }

    public function testHandleMalformed()
    {
        $this->expectException(QueryException::class);
        with(new ImagesCleanupListener)->handle(new ImagesDeleted('abc'));
    }

    public function testNotThere()
    {
        $this->doesntExpectJobs(RemoveAnnotationPatches::class);
        $faker = Faker::create();
        with(new ImagesCleanupListener)->handle(new ImagesDeleted([$faker->uuid()]));
    }

    public function testHandle()
    {
        $image = ImageTest::create();
        $a = ImageAnnotationTest::create(['image_id' => $image->id]);
        $image2 = ImageTest::create(['volume_id' => $image->volume_id, 'filename' => 'a']);
        $a2 = ImageAnnotationTest::create(['image_id' => $image2->id]);

        $this->expectsJobs(RemoveAnnotationPatches::class);
        with(new ImagesCleanupListener)->handle(new ImagesDeleted([$image->uuid, $image2->uuid]));

        $job = end($this->dispatchedJobs);

        $expect = [
            $a->id => $image->uuid,
            $a2->id => $image2->uuid,
        ];
        $this->assertEquals($expect, $job->annotationIds);
    }

    public function testPartial()
    {
        $image = ImageTest::create();
        $a = ImageAnnotationTest::create(['image_id' => $image->id]);
        $image2 = ImageTest::create(['volume_id' => $image->volume_id, 'filename' => 'a']);
        $a2 = ImageAnnotationTest::create(['image_id' => $image2->id]);

        $this->expectsJobs(RemoveAnnotationPatches::class);
        with(new ImagesCleanupListener)->handle(new ImagesDeleted([$image->uuid]));

        $job = end($this->dispatchedJobs);

        $expect = [
            $a->id => $image->uuid,
        ];
        $this->assertEquals($expect, $job->annotationIds);
    }
}
