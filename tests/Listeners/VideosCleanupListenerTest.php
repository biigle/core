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

class VideosCleanupListenerTest extends TestCase
{
    public function testHandleEmpty()
    {
        $this->doesntExpectJobs(RemoveVideoAnnotationPatches::class);
        with(new VideosCleanupListener)->handle(new VideosDeleted([]));
    }

    public function testHandleMalformed()
    {
        $this->expectException(QueryException::class);
        with(new VideosCleanupListener)->handle(new VideosDeleted('abc'));
    }

    public function testNotThere()
    {
        $this->doesntExpectJobs(RemoveVideoAnnotationPatches::class);
        $faker = Faker::create();
        with(new VideosCleanupListener)->handle(new VideosDeleted([$faker->uuid()]));
    }

    public function testHandle()
    {
        $video = VideoTest::create(['filename' => 'a']);
        $a = VideoAnnotationTest::create(['video_id' => $video->id]);
        $video2 = VideoTest::create(['volume_id' => $video->volume_id, 'filename' => 'b']);
        $a2 = VideoAnnotationTest::create(['video_id' => $video2->id]);

        $this->expectsJobs(RemoveVideoAnnotationPatches::class);
        with(new VideosCleanupListener)->handle(new VideosDeleted([$video->uuid, $video2->uuid]));

        $job = end($this->dispatchedJobs);

        $expect = [
            $a->id => $video->uuid,
            $a2->id => $video2->uuid,
        ];
        $this->assertEquals($expect, $job->annotationIds);
    }

    public function testPartial()
    {
        $video = VideoTest::create(['filename' => 'a']);
        $a = VideoAnnotationTest::create(['video_id' => $video->id]);
        $video2 = VideoTest::create(['volume_id' => $video->volume_id, 'filename' => 'b']);
        $a2 = VideoAnnotationTest::create(['video_id' => $video2->id]);

        $this->expectsJobs(RemoveVideoAnnotationPatches::class);
        with(new VideosCleanupListener)->handle(new VideosDeleted([$video->uuid]));

        $job = end($this->dispatchedJobs);

        $expect = [
            $a->id => $video->uuid,
        ];
        $this->assertEquals($expect, $job->annotationIds);
    }
}
