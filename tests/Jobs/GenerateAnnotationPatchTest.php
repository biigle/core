<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use File;
use Mockery;
use TestCase;
use VipsImage;
use Biigle\Shape;
use Biigle\Annotation;
use Biigle\Tests\AnnotationTest;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;

class GenerateAnnotationPatchTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();

        $this->image = Mockery::mock();
        $this->image->width = 1000;
        $this->image->height = 750;
        $this->image->shouldReceive('resize')
            ->once()
            ->andReturn($this->image);
    }

    public function testHandlePoint()
    {
        $annotation = AnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::$pointId,
        ]);
        $job = new GenerateAnnotationPatchStub($annotation);
        $job->mock = $this->image;

        $this->image->shouldReceive('crop')
            ->with(1, 26, 197, 148)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('writeToFile')
            ->with(config('largo.patch_storage').'/'.$annotation->image->volume_id.'/'.$annotation->id.'.jpg')
            ->once()
            ->andReturn($this->image);

        File::shouldReceive('exists')
            ->once()
            ->andReturn(true);

        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleCircle()
    {
        $annotation = AnnotationTest::create([
            // should handle floats correctly
            'points' => [100.4, 100.4, 20],
            'shape_id' => Shape::$circleId,
        ]);
        $job = new GenerateAnnotationPatchStub($annotation);
        $job->mock = $this->image;

        $this->image->shouldReceive('crop')
            ->with(60, 70, 80, 60)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('writeToFile')
            ->once()
            ->andReturn($this->image);

        File::shouldReceive('exists')
            ->once()
            ->andReturn(true);

        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleOther()
    {
        $padding = config('largo.patch_padding');
        $annotation = AnnotationTest::create([
            'points' => [100, 100, 100, 200, 200, 200, 200, 100],
            'shape_id' => Shape::$rectangleId,
        ]);
        $job = new GenerateAnnotationPatchStub($annotation);
        $job->mock = $this->image;

        $this->image->shouldReceive('crop')
            ->with(70, 90, 160, 120)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('writeToFile')
            ->once()
            ->andReturn($this->image);

        File::shouldReceive('exists')
            ->once()
            ->andReturn(true);

        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleContainedNegative()
    {
        $annotation = AnnotationTest::create([
            'points' => [0, 0],
            'shape_id' => Shape::$pointId,
        ]);
        $job = new GenerateAnnotationPatchStub($annotation);
        $job->mock = $this->image;

        $this->image->shouldReceive('crop')
            ->once()
            ->with(0, 0, 197, 148)
            ->andReturn($this->image);

        $this->image->shouldReceive('writeToFile')->andReturn($this->image);
        File::shouldReceive('exists')->andReturn(true);

        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleContainedPositive()
    {
        $annotation = AnnotationTest::create([
            'points' => [1000, 750],
            'shape_id' => Shape::$pointId,
        ]);
        $job = new GenerateAnnotationPatchStub($annotation);
        $job->mock = $this->image;

        $this->image->shouldReceive('crop')
            ->once()
            ->with(803, 602, 197, 148)
            ->andReturn($this->image);

        $this->image->shouldReceive('writeToFile')->andReturn($this->image);
        File::shouldReceive('exists')->andReturn(true);

        $job->handleImage($annotation->image, 'abc');
    }

    public function testHandleContainedTooLarge()
    {
        $this->image->width = 100;
        $this->image->height = 100;

        $annotation = AnnotationTest::create([
            'points' => [50, 50],
            'shape_id' => Shape::$pointId,
        ]);
        $job = new GenerateAnnotationPatchStub($annotation);
        $job->mock = $this->image;

        $this->image->shouldReceive('crop')
            ->once()
            ->with(0, 0, 100, 100)
            ->andReturn($this->image);

        $this->image->shouldReceive('writeToFile')->andReturn($this->image);
        File::shouldReceive('exists')->andReturn(true);

        $job->handleImage($annotation->image, 'abc');
    }
}


class GenerateAnnotationPatchStub extends GenerateAnnotationPatch
{
    public function __construct(Annotation $annotation)
    {
        parent::__construct($annotation);
        $this->annotation = $annotation;
    }

    function getVipsImage($path)
    {
        return $this->mock;
    }
}
