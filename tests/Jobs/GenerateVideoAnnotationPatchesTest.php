<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\VideoAnnotation;
use Biigle\Modules\Largo\Jobs\GenerateVideoAnnotationPatch;
use Biigle\Shape;
use Biigle\Tests\VideoAnnotationTest;
use File;
use Mockery;
use Storage;
use TestCase;

class GenerateVideoAnnotationPatchesTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        config([
            'largo.patch_storage_disk' => 'test',
            'video_patch_count' => 2,
        ]);
    }

    public function testHandleStorage()
    {
        Storage::fake('test');
        $video = $this->getVideoMock();
        $annotation = VideoAnnotationTest::create();
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->twice()
            ->andReturn($video);
        $video->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->twice()
            ->andReturn('abc123');

        $job->handleFile($annotation->video, 'abc');
        $prefix = fragment_uuid_path($annotation->video->uuid);

        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}/0.jpg");
        $this->assertEquals('abc123', $content);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}/1.jpg");
        $this->assertEquals('abc123', $content);
    }

    // public function testHandleStorageConfigurableDisk()
    // {
    //     Storage::fake('test2');
    //     $video = $this->getVideoMock();
    //     $annotation = VideoAnnotationTest::create();
    //     $job = new GenerateVideoAnnotationPatchStub($annotation, 'test2');
    //     $job->mock = $video;

    //     $video->shouldReceive('crop')
    //         ->once()
    //         ->andReturn($video);
    //     $video->shouldReceive('writeToBuffer')
    //         ->with('.jpg', ['Q' => 85, 'strip' => true])
    //         ->once()
    //         ->andReturn('abc123');

    //     $job->handleFile($annotation->video, 'abc');
    //     $prefix = fragment_uuid_path($annotation->video->uuid);
    //     $content = Storage::disk('test2')->get("{$prefix}/{$annotation->id}.jpg");
    //     $this->assertEquals('abc123', $content);
    // }

    // public function testHandlePoint()
    // {
    //     config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
    //     Storage::fake('test');
    //     $video = $this->getVideoMock();
    //     $annotation = VideoAnnotationTest::create([
    //         'points' => [100, 100],
    //         'shape_id' => Shape::pointId(),
    //     ]);
    //     $job = new GenerateVideoAnnotationPatchStub($annotation);
    //     $job->mock = $video;

    //     $video->shouldReceive('crop')
    //         ->with(26, 26, 148, 148)
    //         ->once()
    //         ->andReturn($video);

    //     $video->shouldReceive('writeToBuffer')->once();
    //     $job->handleFile($annotation->video, 'abc');
    // }

    // public function testHandleCircle()
    // {
    //     config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
    //     Storage::fake('test');
    //     $video = $this->getVideoMock();
    //     $annotation = VideoAnnotationTest::create([
    //         // Should handle floats correctly.
    //         // Make the circle large enough so the crop is not affected by the minimum
    //         // dimension.
    //         'points' => [300.4, 300.4, 200],
    //         'shape_id' => Shape::circleId(),
    //     ]);
    //     $job = new GenerateVideoAnnotationPatchStub($annotation);
    //     $job->mock = $video;

    //     $video->shouldReceive('crop')
    //         ->with(90, 90, 420, 420)
    //         ->once()
    //         ->andReturn($video);

    //     $video->shouldReceive('writeToBuffer')->once();
    //     $job->handleFile($annotation->video, 'abc');
    // }
    //
    // public function testHandleWholeFrame()
    // {
    //     $this->markTestIncomplete();
    // }

    // public function testHandleOther()
    // {
    //     config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
    //     Storage::fake('test');
    //     $video = $this->getVideoMock();
    //     $padding = config('largo.patch_padding');
    //     $annotation = VideoAnnotationTest::create([
    //         // Make the polygon large enough so the crop is not affected by the minimum
    //         // dimension.
    //         'points' => [100, 100, 100, 300, 300, 300, 300, 100],
    //         'shape_id' => Shape::rectangleId(),
    //     ]);
    //     $job = new GenerateVideoAnnotationPatchStub($annotation);
    //     $job->mock = $video;

    //     $video->shouldReceive('crop')
    //         ->with(90, 90, 220, 220)
    //         ->once()
    //         ->andReturn($video);

    //     $video->shouldReceive('writeToBuffer')->once();
    //     $job->handleFile($annotation->video, 'abc');
    // }

    // public function testHandleContainedNegative()
    // {
    //     config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
    //     Storage::fake('test');
    //     $video = $this->getVideoMock();
    //     $annotation = VideoAnnotationTest::create([
    //         'points' => [0, 0],
    //         'shape_id' => Shape::pointId(),
    //     ]);
    //     $job = new GenerateVideoAnnotationPatchStub($annotation);
    //     $job->mock = $video;

    //     $video->shouldReceive('crop')
    //         ->once()
    //         ->with(0, 0, 148, 148)
    //         ->andReturn($video);

    //     $video->shouldReceive('writeToBuffer')->once();
    //     $job->handleFile($annotation->video, 'abc');
    // }

    // public function testHandleContainedPositive()
    // {
    //     config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
    //     Storage::fake('test');
    //     $video = $this->getVideoMock();
    //     $annotation = VideoAnnotationTest::create([
    //         'points' => [1000, 750],
    //         'shape_id' => Shape::pointId(),
    //     ]);
    //     $job = new GenerateVideoAnnotationPatchStub($annotation);
    //     $job->mock = $video;

    //     $video->shouldReceive('crop')
    //         ->once()
    //         ->with(852, 602, 148, 148)
    //         ->andReturn($video);

    //     $video->shouldReceive('writeToBuffer')->once();
    //     $job->handleFile($annotation->video, 'abc');
    // }

    // public function testHandleContainedTooLarge()
    // {
    //     config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
    //     Storage::fake('test');
    //     $video = $this->getVideoMock();
    //     $video->width = 100;
    //     $video->height = 100;

    //     $annotation = VideoAnnotationTest::create([
    //         'points' => [50, 50],
    //         'shape_id' => Shape::pointId(),
    //     ]);
    //     $job = new GenerateVideoAnnotationPatchStub($annotation);
    //     $job->mock = $video;

    //     $video->shouldReceive('crop')
    //         ->once()
    //         ->with(0, 0, 100, 100)
    //         ->andReturn($video);

    //     $video->shouldReceive('writeToBuffer')->once();
    //     $job->handleFile($annotation->video, 'abc');
    // }

    // public function testHandleMinDimension()
    // {
    //     config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
    //     Storage::fake('test');
    //     $video = $this->getVideoMock();
    //     $annotation = VideoAnnotationTest::create([
    //         'points' => [60, 60, 10],
    //         'shape_id' => Shape::circleId(),
    //     ]);
    //     $job = new GenerateVideoAnnotationPatchStub($annotation);
    //     $job->mock = $video;

    //     $video->shouldReceive('crop')
    //         ->with(10, 10, 100, 100)
    //         ->once()
    //         ->andReturn($video);

    //     $video->shouldReceive('writeToBuffer')->once();
    //     $job->handleFile($annotation->video, 'abc');
    // }

    protected function getVideoMock($times = 1)
    {
        $video = Mockery::mock();
        $video->width = 1000;
        $video->height = 750;
        // $video->shouldReceive('resize')
        //     ->times($times)
        //     ->andReturn($video);

        return $video;
    }
}

class GenerateVideoAnnotationPatchStub extends GenerateVideoAnnotationPatch
{
    public function getVideoFrame($video, $time)
    {
        return $this->mock;
    }
}
