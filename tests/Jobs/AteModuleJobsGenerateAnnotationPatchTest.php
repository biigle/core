<?php

use Dias\Modules\Ate\Jobs\GenerateAnnotationPatch;
use Dias\Shape;
use InterventionImage as IImage;

class AteModuleJobsGenerateAnnotationPatchTest extends TestCase
{
    public function testHandlePoint()
    {
        $annotation = AnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::$pointId,
        ]);
        $job = new GenerateAnnotationPatch($annotation);

        $mock = Mockery::mock(IImage::make($annotation->image->url));

        $mock->shouldReceive('crop')
            ->with(197, 148, 1, 26)
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

        File::shouldReceive('exists')
            ->once()
            ->andReturn(true);

        $job->handle();
    }

    public function testHandleCircle()
    {
        $annotation = AnnotationTest::create([
            // should handle floats correctly
            'points' => [100.4, 100.4, 20],
            'shape_id' => Shape::$circleId,
        ]);
        $job = new GenerateAnnotationPatch($annotation);

        $mock = Mockery::mock(IImage::make($annotation->image->url));

        $mock->shouldReceive('crop')
            ->with(80, 60, 60, 70)
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

        File::shouldReceive('exists')
            ->once()
            ->andReturn(true);

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
            ->with(160, 120, 70, 90)
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

        File::shouldReceive('exists')
            ->once()
            ->andReturn(true);

        $job->handle();
    }
}
