<?php

namespace Biigle\Tests\Modules\Largo\Listeners;

use TestCase;
use Faker\Factory as Faker;
use Biigle\Tests\ImageTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Events\ImagesDeleted;
use Illuminate\Database\QueryException;
use Biigle\Modules\Largo\Jobs\RemoveAnnotationPatches;
use Biigle\Modules\Largo\Listeners\ImagesCleanupListener;

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
        $a = AnnotationTest::create(['image_id' => $image->id]);
        $image2 = ImageTest::create(['volume_id' => $image->volume_id, 'filename' => 'a']);
        $a2 = AnnotationTest::create(['image_id' => $image2->id]);

        $this->expectsJobs(RemoveAnnotationPatches::class);
        with(new ImagesCleanupListener)->handle(new ImagesDeleted([$image->uuid, $image2->uuid]));

        $job = end($this->dispatchedJobs);

        $this->assertEquals($image->volume_id, $job->volumeId);
        $this->assertEquals([$a->id, $a2->id], $job->annotationIds);
    }

    public function testPartial()
    {
        $image = ImageTest::create();
        $a = AnnotationTest::create(['image_id' => $image->id]);
        $image2 = ImageTest::create(['volume_id' => $image->volume_id, 'filename' => 'a']);
        $a2 = AnnotationTest::create(['image_id' => $image2->id]);

        $this->expectsJobs(RemoveAnnotationPatches::class);
        with(new ImagesCleanupListener)->handle(new ImagesDeleted([$image->uuid]));

        $job = end($this->dispatchedJobs);

        $this->assertEquals($image->volume_id, $job->volumeId);
        $this->assertEquals([$a->id], $job->annotationIds);
    }
}
