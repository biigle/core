<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Modules\Largo\Jobs\GenerateImageAnnotationPatch;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationTest;
use Bus;
use Exception;
use FileCache;
use Log;
use Mockery;
use Storage;
use TestCase;

class GenerateImageAnnotationPatchTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        config(['largo.patch_storage_disk' => 'test']);
    }

    public function testHandleStorage()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->andReturn($image);
        $image->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handleFile($annotation->image, 'abc');
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.jpg");
        $this->assertEquals('abc123', $content);
    }

    public function testHandleStorageConfigurableDisk()
    {
        Storage::fake('test2');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation, 'test2');
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->andReturn($image);
        $image->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handleFile($annotation->image, 'abc');
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test2')->get("{$prefix}/{$annotation->id}.jpg");
        $this->assertEquals('abc123', $content);
    }

    public function testHandlePoint()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(26, 26, 148, 148)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->image, 'abc');
    }

    public function testHandleCircle()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            // Should handle floats correctly.
            // Make the circle large enough so the crop is not affected by the minimum
            // dimension.
            'points' => [300.4, 300.4, 200],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(90, 90, 420, 420)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->image, 'abc');
    }

    public function testHandleOther()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            // Make the polygon large enough so the crop is not affected by the minimum
            // dimension.
            'points' => [100, 100, 100, 300, 300, 300, 300, 100],
            'shape_id' => Shape::rectangleId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(90, 90, 220, 220)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->image, 'abc');
    }

    public function testHandleContainedNegative()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'points' => [0, 0],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->with(0, 0, 148, 148)
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->image, 'abc');
    }

    public function testHandleContainedPositive()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'points' => [1000, 750],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->with(852, 602, 148, 148)
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->image, 'abc');
    }

    public function testHandleContainedTooLarge()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $image->width = 100;
        $image->height = 100;

        $annotation = ImageAnnotationTest::create([
            'points' => [50, 50],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->with(0, 0, 100, 100)
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->image, 'abc');
    }

    public function testHandleMinDimension()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'points' => [60, 60, 10],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(10, 10, 100, 100)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->image, 'abc');
    }

    public function testHandleError()
    {
        FileCache::shouldReceive('get')->andThrow(new Exception('error'));
        Log::shouldReceive('warning')->once();

        $annotation = ImageAnnotationTest::create();
        $annotation->shape_id = Shape::pointId();
        $job = new GenerateImageAnnotationPatch($annotation);
        $job->handle();
    }

    public function testFileLockedError()
    {
        Bus::fake();
        FileCache::shouldReceive('get')->andThrow(FileLockedException::class);

        $annotation = ImageAnnotationTest::create();
        $annotation->shape_id = Shape::pointId();
        $job = new GenerateImageAnnotationPatch($annotation);
        $job->handle();
        Bus::assertDispatched(GenerateImageAnnotationPatch::class);
    }

    protected function getImageMock($times = 1)
    {
        $image = Mockery::mock();
        $image->width = 1000;
        $image->height = 750;
        $image->shouldReceive('resize')
            ->times($times)
            ->andReturn($image);

        return $image;
    }
}

class GenerateImageAnnotationPatchStub extends GenerateImageAnnotationPatch
{
    public function getVipsImage($path)
    {
        return $this->mock;
    }
}
