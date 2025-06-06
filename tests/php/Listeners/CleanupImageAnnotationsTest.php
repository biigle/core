<?php

namespace Biigle\Tests\Listeners;

use Biigle\Events\ImagesDeleted;
use Biigle\Jobs\RemoveImageAnnotationPatches;
use Biigle\Listeners\CleanupImageAnnotations;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Faker\Factory as Faker;
use Illuminate\Database\QueryException;
use Queue;
use TestCase;

class CleanupImageAnnotationsTest extends TestCase
{
    public function testHandleEmpty()
    {
        with(new CleanupImageAnnotations)->handle(new ImagesDeleted([]));
        Queue::assertNotPushed(RemoveImageAnnotationPatches::class);
    }

    public function testHandleMalformed()
    {
        $this->expectException(QueryException::class);
        with(new CleanupImageAnnotations)->handle(new ImagesDeleted('abc'));
    }

    public function testNotThere()
    {
        $faker = Faker::create();
        with(new CleanupImageAnnotations)->handle(new ImagesDeleted([$faker->uuid()]));
        Queue::assertNotPushed(RemoveImageAnnotationPatches::class);
    }

    public function testHandle()
    {
        $image = ImageTest::create();
        $a = ImageAnnotationTest::create(['image_id' => $image->id]);
        $image2 = ImageTest::create(['volume_id' => $image->volume_id, 'filename' => 'a']);
        $a2 = ImageAnnotationTest::create(['image_id' => $image2->id]);

        with(new CleanupImageAnnotations)->handle(new ImagesDeleted([$image->uuid, $image2->uuid]));

        $expect = [
            $a->id => $image->uuid,
            $a2->id => $image2->uuid,
        ];

        Queue::assertPushed(function (RemoveImageAnnotationPatches $job) use ($expect) {
            $this->assertSame($expect, $job->annotationIds);

            return true;
        });
    }

    public function testPartial()
    {
        $image = ImageTest::create();
        $a = ImageAnnotationTest::create(['image_id' => $image->id]);
        $image2 = ImageTest::create(['volume_id' => $image->volume_id, 'filename' => 'a']);
        $a2 = ImageAnnotationTest::create(['image_id' => $image2->id]);

        with(new CleanupImageAnnotations)->handle(new ImagesDeleted([$image->uuid]));

        $expect = [
            $a->id => $image->uuid,
        ];

        Queue::assertPushed(function (RemoveImageAnnotationPatches $job) use ($expect) {
            $this->assertSame($expect, $job->annotationIds);

            return true;
        });
    }
}
