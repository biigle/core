<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use File;
use Mockery;
use Storage;
use TestCase;
use Biigle\Shape;
use Biigle\Annotation;
use Biigle\Tests\AnnotationTest;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;

class GenerateAnnotationPatchTest extends TestCase
{
    public function testHandleSerialization()
    {
        $this->getImageMock(0);
        $annotation = AnnotationTest::create();
        $job = serialize(new GenerateAnnotationPatchStub($annotation, 'test'));
        $annotation->delete();
        $job = unserialize($job);
        // This should throw no error and should not perform any processing.
        $job->handle();
    }

    public function testHandleStorage()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = AnnotationTest::create();
        $job = new GenerateAnnotationPatchStub($annotation, 'test');
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->andReturn($image);
        $image->shouldReceive('writeToBuffer')
            ->with('.jpg')
            ->once()
            ->andReturn('abc123');

        $job->handleImage($annotation->image, 'abc');
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.jpg");
        $this->assertEquals('abc123', $content);
    }

    public function testHandlePoint()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = AnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateAnnotationPatchStub($annotation, 'test');
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(1, 26, 197, 148)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once();
        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleCircle()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = AnnotationTest::create([
            // should handle floats correctly
            'points' => [100.4, 100.4, 20],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new GenerateAnnotationPatchStub($annotation, 'test');
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(60, 70, 80, 60)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once();
        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleOther()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $padding = config('largo.patch_padding');
        $annotation = AnnotationTest::create([
            'points' => [100, 100, 100, 200, 200, 200, 200, 100],
            'shape_id' => Shape::rectangleId(),
        ]);
        $job = new GenerateAnnotationPatchStub($annotation, 'test');
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(70, 90, 160, 120)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once();
        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleContainedNegative()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = AnnotationTest::create([
            'points' => [0, 0],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateAnnotationPatchStub($annotation, 'test');
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->with(0, 0, 197, 148)
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once();
        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleContainedPositive()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = AnnotationTest::create([
            'points' => [1000, 750],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateAnnotationPatchStub($annotation, 'test');
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->with(803, 602, 197, 148)
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once();
        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleContainedTooLarge()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $image->width = 100;
        $image->height = 100;

        $annotation = AnnotationTest::create([
            'points' => [50, 50],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateAnnotationPatchStub($annotation, 'test');
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->with(0, 0, 100, 100)
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once();
        $job->handleImage($annotation->image, 'abc');
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

class GenerateAnnotationPatchStub extends GenerateAnnotationPatch
{
    public function __construct(Annotation $annotation, $targetDisk)
    {
        parent::__construct($annotation, $targetDisk);
        $this->annotation = $annotation;
    }

    public function getVipsImage($path)
    {
        return $this->mock;
    }
}
