<?php

namespace Biigle\Tests\Modules\Largo\Listeners;

use Biigle\Events\VideosDeleted;
use Biigle\Modules\Largo\Jobs\RemoveVideoAnnotationPatches;
use Biigle\Modules\Largo\Listeners\VideosCleanupListener;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Faker\Factory as Faker;
use Illuminate\Database\QueryException;
use TestCase;
use Queue;

class VideosCleanupListenerTest extends TestCase
{
    public function testHandleEmpty()
    {
        with(new VideosCleanupListener)->handle(new VideosDeleted([]));
        Queue::assertNotPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testHandleMalformed()
    {
        $this->expectException(QueryException::class);
        with(new VideosCleanupListener)->handle(new VideosDeleted('abc'));
    }

    public function testNotThere()
    {
        $faker = Faker::create();
        with(new VideosCleanupListener)->handle(new VideosDeleted([$faker->uuid()]));
        Queue::assertNotPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testHandle()
    {
        $video = VideoTest::create(['filename' => 'a']);
        $a = VideoAnnotationTest::create(['video_id' => $video->id]);
        $video2 = VideoTest::create(['volume_id' => $video->volume_id, 'filename' => 'b']);
        $a2 = VideoAnnotationTest::create(['video_id' => $video2->id]);

        with(new VideosCleanupListener)->handle(new VideosDeleted([$video->uuid, $video2->uuid]));

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

        with(new VideosCleanupListener)->handle(new VideosDeleted([$video->uuid]));

        $expect = [
            $a->id => $video->uuid,
        ];

        Queue::assertPushed(function (RemoveVideoAnnotationPatches $job) use ($expect) {
            $this->assertSame($expect, $job->annotationIds);

            return true;
        });
    }
}
