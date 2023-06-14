<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Modules\Largo\Jobs\GenerateVideoAnnotationPatch;
use Biigle\Shape;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\VideoAnnotation;
use Bus;
use Exception;
use FFMpeg\Media\Video;
use File;
use FileCache;
use Log;
use Mockery;
use Storage;
use TestCase;

class GenerateVideoAnnotationPatchesTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        config(['largo.patch_storage_disk' => 'test']);
    }

    public function testHandleStorage()
    {
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [],
            'frames' => [0, 10],
            'shape_id' => Shape::wholeFrameId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handleFile($annotation->video, 'abc');
        $prefix = fragment_uuid_path($annotation->video->uuid);

        $content = Storage::disk('test')->get("{$prefix}/v-{$annotation->id}.jpg");
        $this->assertEquals('abc123', $content);
    }

    public function testHandleStorageConfigurableDisk()
    {
        Storage::fake('test2');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [],
            'frames' => [0, 10],
            'shape_id' => Shape::wholeFrameId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation, 'test2');
        $job->mock = $video;

        $video->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handleFile($annotation->video, 'abc');
        $prefix = fragment_uuid_path($annotation->video->uuid);

        $content = Storage::disk('test2')->get("{$prefix}/v-{$annotation->id}.jpg");
        $this->assertEquals('abc123', $content);
    }

    public function testHandlePoint()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            // Should handle floats correctly.
            'points' => [[100.4, 100.4], [200, 200]],
            'frames' => [1, 2],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(26, 26, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleCircle()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            // Make the circle large enough so the crop is not affected by the minimum
            // dimension.
            'points' => [[300, 300, 200], [400, 400, 200]],
            'frames' => [1, 2],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(90, 90, 420, 420)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleOther()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            // Make the polygon large enough so the crop is not affected by the minimum
            // dimension.
            'points' => [
                [100, 100, 150, 200, 200, 100, 100, 100],
                [200, 200, 250, 300, 300, 200, 200, 200],
            ],
            'frames' => [1, 2],
            'shape_id' => Shape::polygonId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(90, 90, 120, 120)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
    }

    public function testHandleSingleFrame()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[100, 100]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(26, 26, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleContainedNegative()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[0, 0]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(0, 0, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleContainedPositive()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[1000, 750]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(852, 602, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleContainedTooLarge()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $video->width = 100;
        $video->height = 100;

        $annotation = VideoAnnotationTest::create([
            'points' => [[50, 50]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->once()
            ->with(0, 0, 100, 100)
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleMinDimension()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[60, 60, 10]],
            'frames' => [1],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(10, 10, 100, 100)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
    }

    public function testHandleError()
    {
        FileCache::shouldReceive('get')->andThrow(new Exception('error'));
        Log::shouldReceive('warning')->once();

        $annotation = VideoAnnotationTest::create();
        $job = new GenerateVideoAnnotationPatch($annotation);
        $job->handle();
    }

    public function testFileLockedError()
    {
        Bus::fake();
        FileCache::shouldReceive('get')->andThrow(FileLockedException::class);

        $annotation = VideoAnnotationTest::create();
        $job = new GenerateVideoAnnotationPatch($annotation);
        $job->handle();
        Bus::assertDispatched(GenerateVideoAnnotationPatch::class);
    }

    protected function getFrameMock($times = 1)
    {
        $video = Mockery::mock();
        $video->width = 1000;
        $video->height = 750;
        $video->shouldReceive('resize')
            ->times($times)
            ->andReturn($video);

        return $video;
    }
}

class GenerateVideoAnnotationPatchStub extends GenerateVideoAnnotationPatch
{
    public $times = [];

    public function getVideo($path)
    {
        return Mockery::mock(Video::class);
    }

    public function getVideoFrame(Video $video, $time)
    {
        $this->times[] = $time;

        return $this->mock;
    }
}
