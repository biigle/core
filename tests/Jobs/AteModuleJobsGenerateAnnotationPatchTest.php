<?php

use Dias\Modules\Ate\Jobs\GenerateAnnotationPatch;
use Dias\Shape;
use InterventionImage as IImage;

class GenerateAnnotationPatchTest extends TestCase
{
    public function testHandlePoint()
    {
        $padding = config('ate.patch_padding');
        $annotation = AnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::$pointId,
        ]);
        $job = new GenerateAnnotationPatch($annotation);

        $mock = Mockery::mock(IImage::make($annotation->image->url));

        $mock->shouldReceive('crop')
            ->with(
                128 + 2 * $padding,
                128 + 2 * $padding,
                36 - $padding,
                36 - $padding
            )
            ->once()
            ->andReturn($mock);

        $mock->shouldReceive('encode')
            ->with('jpg')
            ->once()
            ->andReturn($mock);

        $mock->shouldReceive('save')
            ->with(config('ate.patch_storage').'/'.$annotation->image->transect_id.'/'.$annotation->id.'.jpg')
            ->once()
            ->andReturn($mock);

        $mock->shouldReceive('destroy')
            ->once();

        IImage::shouldReceive('make')
            ->with($annotation->image->url)
            ->once()
            ->andReturn($mock);

        $job->handle();
    }

    public function testHandleCircle()
    {
        $padding = config('ate.patch_padding');
        $annotation = AnnotationTest::create([
            'points' => [100, 100, 20],
            'shape_id' => Shape::$circleId,
        ]);
        $job = new GenerateAnnotationPatch($annotation);

        $mock = Mockery::mock(IImage::make($annotation->image->url));

        $mock->shouldReceive('crop')
            ->with(
                40 + 2 * $padding,
                40 + 2 * $padding,
                80 - $padding,
                80 - $padding
            )
            ->once()
            ->andReturn($mock);

        $mock->shouldReceive('encode')
            ->once()
            ->andReturn($mock);

        $mock->shouldReceive('save')
            ->once()
            ->andReturn($mock);

        $mock->shouldReceive('destroy')
            ->once();

        IImage::shouldReceive('make')
            ->once()
            ->andReturn($mock);

        $job->handle();
    }

    public function testHandleOther()
    {
        $padding = config('ate.patch_padding');
        $annotation = AnnotationTest::create([
            'points' => [100, 100, 100, 200, 200, 200, 200, 100],
            'shape_id' => Shape::$rectangleId,
        ]);
        $job = new GenerateAnnotationPatch($annotation);

        $mock = Mockery::mock(IImage::make($annotation->image->url));

        $mock->shouldReceive('crop')
            ->with(
                100 + 2 * $padding,
                100 + 2 * $padding,
                100 - $padding,
                100 - $padding
            )
            ->once()
            ->andReturn($mock);

        $mock->shouldReceive('encode')
            ->once()
            ->andReturn($mock);

        $mock->shouldReceive('save')
            ->once()
            ->andReturn($mock);

        $mock->shouldReceive('destroy')
            ->once();

        IImage::shouldReceive('make')
            ->once()
            ->andReturn($mock);

        $job->handle();
    }
}
