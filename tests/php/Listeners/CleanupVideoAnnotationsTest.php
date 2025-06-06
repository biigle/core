<?php

namespace Biigle\Tests\Listeners;

use Biigle\Events\VideosDeleted;
use Biigle\Jobs\RemoveVideoAnnotationPatches;
use Biigle\Listeners\CleanupVideoAnnotations;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Faker\Factory as Faker;
use Illuminate\Database\QueryException;
use Queue;
use TestCase;

class CleanupVideoAnnotationsTest extends TestCase
{
    public function testHandleEmpty()
    {
        with(new CleanupVideoAnnotations)->handle(new VideosDeleted([]));
        Queue::assertNotPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testHandleMalformed()
    {
        $this->expectException(QueryException::class);
        with(new CleanupVideoAnnotations)->handle(new VideosDeleted('abc'));
    }

    public function testNotThere()
    {
        $faker = Faker::create();
        with(new CleanupVideoAnnotations)->handle(new VideosDeleted([$faker->uuid()]));
        Queue::assertNotPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testHandle()
    {
        $video = VideoTest::create(['filename' => 'a']);
        $a = VideoAnnotationTest::create(['video_id' => $video->id]);
        $video2 = VideoTest::create(['volume_id' => $video->volume_id, 'filename' => 'b']);
        $a2 = VideoAnnotationTest::create(['video_id' => $video2->id]);

        with(new CleanupVideoAnnotations)->handle(new VideosDeleted([$video->uuid, $video2->uuid]));

        $expect = [
            $a->id => $video->uuid,
            $a2->id => $video2->uuid,
        ];

        Queue::assertPushed(function (RemoveVideoAnnotationPatches $job) use ($expect) {
            $this->assertSame($expect, $job->annotationIds);

            return true;
        });
    }

    public function testPartial()
    {
        $video = VideoTest::create(['filename' => 'a']);
        $a = VideoAnnotationTest::create(['video_id' => $video->id]);
        $video2 = VideoTest::create(['volume_id' => $video->volume_id, 'filename' => 'b']);
        $a2 = VideoAnnotationTest::create(['video_id' => $video2->id]);

        with(new CleanupVideoAnnotations)->handle(new VideosDeleted([$video->uuid]));

        $expect = [
            $a->id => $video->uuid,
        ];

        Queue::assertPushed(function (RemoveVideoAnnotationPatches $job) use ($expect) {
            $this->assertSame($expect, $job->annotationIds);

            return true;
        });
    }
}
