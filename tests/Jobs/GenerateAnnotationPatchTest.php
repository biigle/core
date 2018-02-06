<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use File;
use Mockery;
use TestCase;
use VipsImage;
use Biigle\Shape;
use Biigle\Annotation;
use Jcupitt\Vips\Image;
use Biigle\Tests\AnnotationTest;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;

class GenerateAnnotationPatchTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();

        // alias: is required because we want to test the public static method
        // newFromFile.
        $this->image = Mockery::mock(Image::class);
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
