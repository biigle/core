<?php

namespace Biigle\Tests\Jobs;

use Biigle\Events\ObjectTrackingFailed;
use Biigle\Events\ObjectTrackingSucceeded;
use Biigle\Jobs\TrackObject;
use Biigle\Shape;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\User;
use Biigle\VideoAnnotation;
use Exception;
use File;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Log;
use Storage;
use TestCase;

class TrackObjectTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        Storage::fake('test');
        Storage::disk('test')->put('files/my-video.mp4', 'abc');
    }

    public function testHandle()
    {
        config(['videos.keyframe_distance' => 123]);

        $user = User::factory()->create();
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'frames' => [0.5],
            'points' => [[0, 0]],
            'video_id' => VideoTest::create(['filename' => 'my-video.mp4']),
        ]);

        $job = new TrackObjectStub($annotation, $user);
        $job->handle();
        $this->assertSame(2, count($job->files));
        $input = json_decode($job->files[0], true);
        $this->assertSame(0.5, $input['start_time']);
        $this->assertSame(123, $input['keyframe_distance']);
        $this->assertArrayHasKey('video_path', $input);

        foreach ($job->paths as $path) {
            $this->assertFalse(File::exists($path));
        }
    }

    public function testHandleCacheKeyOne()
    {
        config(['videos.keyframe_distance' => 123]);

        $user = User::factory()->create();
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'frames' => [0.5],
            'points' => [[0, 0]],
            'video_id' => VideoTest::create(['filename' => 'my-video.mp4']),
        ]);

        Cache::put(TrackObjectStub::getRateLimitCacheKey($user->id), 1);

        $job = new TrackObjectStub($annotation, $user);
        $job->handle();

        $this->assertFalse(Cache::has(TrackObjectStub::getRateLimitCacheKey($user->id)));
    }

    public function testHandleCacheKeyMany()
    {
        config(['videos.keyframe_distance' => 123]);

        $user = User::factory()->create();
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'frames' => [0.5],
            'points' => [[0, 0]],
            'video_id' => VideoTest::create(['filename' => 'my-video.mp4']),
        ]);

        Cache::put(TrackObjectStub::getRateLimitCacheKey($user->id), 2);

        $job = new TrackObjectStub($annotation, $user);
        $job->handle();

        $this->assertSame(1, Cache::get(TrackObjectStub::getRateLimitCacheKey($user->id)));
    }

    public function testHandleCachKeyMissingAnnotation()
    {
        $user = User::factory()->create();
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'frames' => [0.5],
            'points' => [[0, 0]],
            'video_id' => VideoTest::create(['filename' => 'my-video.mp4']),
        ]);

        Cache::put(TrackObjectStub::getRateLimitCacheKey($user->id), 1);

        $job = new TrackObjectStub($annotation, $user);
        $annotation->delete();
        $job->handle();

        $this->assertFalse(Cache::has(TrackObjectStub::getRateLimitCacheKey($user->id)));
    }

    public function testHandleCachKeyMissingUser()
    {
        $user = User::factory()->create();
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'frames' => [0.5],
            'points' => [[0, 0]],
            'video_id' => VideoTest::create(['filename' => 'my-video.mp4']),
        ]);

        Cache::put(TrackObjectStub::getRateLimitCacheKey($user->id), 1);

        $job = new TrackObjectStub($annotation, $user);
        $user->delete();
        $job->handle();

        $this->assertFalse(Cache::has(TrackObjectStub::getRateLimitCacheKey($user->id)));
    }

    public function testHandlePoint()
    {
        Event::fake();
        config(['videos.tracking_point_padding' => 15]);

        $user = User::factory()->create();
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'frames' => [0.5],
            'points' => [[0, 0]],
            'video_id' => VideoTest::create(['filename' => 'my-video.mp4']),
        ]);

        $job = new TrackObjectStub($annotation, $user);
        $job->handle();

        Event::assertDispatched(function (ObjectTrackingSucceeded $event) use ($annotation, $user) {
            $this->assertSame($user->id, $event->user->id);
            $this->assertSame($annotation->id, $event->annotation->id);
            return true;
        });

        $this->assertSame([0.5, 1, 2, 3], $annotation->fresh()->frames);
        $expect = [[0, 0], [10, 10], [20, 20], [30, 30]];
        $this->assertSame($expect, $annotation->fresh()->points);

        $input = json_decode($job->files[0], true);
        $this->assertSame([-15, -15, 30, 30], $input['start_window']);
    }

    public function testHandleCirlce()
    {
        Event::fake();
        $user = User::factory()->create();
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::circleId(),
            'frames' => [0.5],
            'points' => [[10, 10, 5]],
            'video_id' => VideoTest::create(['filename' => 'my-video.mp4']),
        ]);

        $job = new TrackObjectStub($annotation, $user);
        $job->handle();

        Event::assertDispatched(function (ObjectTrackingSucceeded $event) use ($annotation, $user) {
            $this->assertSame($user->id, $event->user->id);
            $this->assertSame($annotation->id, $event->annotation->id);
            return true;
        });

        $this->assertSame([0.5, 1, 2, 3], $annotation->fresh()->frames);
        $expect = [[10, 10, 5], [10, 10, 5], [20, 20, 6], [30, 30, 7]];
        $this->assertSame($expect, $annotation->fresh()->points);

        $input = json_decode($job->files[0], true);
        $this->assertSame([5, 5, 10, 10], $input['start_window']);
    }

    public function testHandleFailure()
    {
        Event::fake();
        Log::shouldReceive('warning')->once();
        $user = User::factory()->create();
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'frames' => [0.5],
            'points' => [[10, 10]],
        ]);
        $job = new TrackObjectStub($annotation, $user);
        $job->throw = true;
        $job->handle();
        Event::assertDispatched(function (ObjectTrackingFailed $event) use ($annotation, $user) {
            $this->assertSame($user->id, $event->user->id);
            $this->assertSame($annotation->id, $event->annotation->id);
            return true;
        });

        $annotation->refresh();
        $this->assertSame([0.5], $annotation->frames);
        $this->assertSame([[10, 10]], $annotation->points);
    }

    public function testHandleEmpty()
    {
        Event::fake();
        Log::shouldReceive('warning')->once();
        $user = User::factory()->create();
        $annotation = VideoAnnotationTest::create([
            'shape_id' => Shape::circleId(),
            'frames' => [0.5],
            'points' => [[10, 10, 5]],
            'video_id' => VideoTest::create(['filename' => 'my-video.mp4']),
        ]);
        $job = new TrackObjectStub($annotation, $user);
        $job->keyframes = '[]';
        $job->handle();
        Event::assertDispatched(function (ObjectTrackingFailed $event) use ($annotation, $user) {
            $this->assertSame($user->id, $event->user->id);
            $this->assertSame($annotation->id, $event->annotation->id);
            return true;
        });

        $annotation->refresh();
        $this->assertSame([0.5], $annotation->frames);
        $this->assertSame([[10, 10, 5]], $annotation->points);
    }
}

class TrackObjectStub extends TrackObject
{
    public $files = [];
    public $paths = [];
    public $keyframes = '[[1.0, 10, 10, 5], [2.0, 20, 20, 6], [3.0, 30, 30, 7]]';
    public $throw = false;

    protected function getTrackingKeyframes(VideoAnnotation $annotation)
    {
        if ($this->throw) {
            throw new Exception("Error Processing Request");
        }

        return parent::getTrackingKeyframes($annotation);
    }

    protected function maybeDeleteFile($path)
    {
        $this->files[] = File::get($path);
        $this->paths[] = $path;

        return parent::maybeDeleteFile($path);
    }

    protected function python($command)
    {
        File::put($this->getOutputJsonPath($this->annotationId), $this->keyframes);
    }
}
