<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use App;
use File;
use Mockery;
use TestCase;
use Biigle\Shape;
use Intervention\Image\Image;
use InterventionImage as IImage;
use Biigle\Tests\AnnotationTest;
use Intervention\Image\ImageCache;
use Intervention\Image\ImageManager;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;

class LargoModuleJobsGenerateAnnotationPatchTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->image = Mockery::mock(Image::class);
    }

    public function testCacheRemoteImage()
    {
        $annotation = AnnotationTest::create();
        $annotation->image->volume->url = 'http://example.com';
        $annotation->image->volume->save();
        $job = new GenerateAnnotationPatch($annotation);

        $manager = Mockery::mock(ImageManager::class);
        App::bind(ImageCache::class, function () use ($manager) {
            return new ImageCache($manager);
        });

        $manager->shouldReceive('make')
            ->with($annotation->image->url)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('encode')
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('crop')->once()->andReturn($this->image);
        $this->image->shouldReceive('save')->once()->andReturn($this->image);
        $this->image->shouldReceive('destroy')->once();

        $job->handle();
    }

    public function testDontCacheLocalImage()
    {
        $annotation = AnnotationTest::create();
        $annotation->image->volume->url = '/vol/images';
        $annotation->image->volume->save();
        $job = new GenerateAnnotationPatch($annotation);

        IImage::shouldReceive('make')
            ->with($annotation->image->url)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('crop')->once()->andReturn($this->image);
        $this->image->shouldReceive('save')->once()->andReturn($this->image);
        $this->image->shouldReceive('destroy')->once();

        $job->handle();
    }

    public function testHandlePoint()
    {
        $annotation = AnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::$pointId,
        ]);
        $job = new GenerateAnnotationPatch($annotation);

        IImage::shouldReceive('make')
            ->with($annotation->image->url)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('crop')
            ->with(197, 148, 1, 26)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('save')
            ->with(config('largo.patch_storage').'/'.$annotation->image->volume_id.'/'.$annotation->id.'.jpg')
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('destroy')
            ->once();

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

        IImage::shouldReceive('make')
            ->with($annotation->image->url)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('crop')
            ->with(80, 60, 60, 70)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('save')
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('destroy')
            ->once();

        File::shouldReceive('exists')
            ->once()
            ->andReturn(true);

        $job->handle();
    }

    public function testHandleOther()
    {
        $padding = config('largo.patch_padding');
        $annotation = AnnotationTest::create([
            'points' => [100, 100, 100, 200, 200, 200, 200, 100],
            'shape_id' => Shape::$rectangleId,
        ]);
        $job = new GenerateAnnotationPatch($annotation);

        IImage::shouldReceive('make')
            ->with($annotation->image->url)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('crop')
            ->with(160, 120, 70, 90)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('save')
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('destroy')
            ->once();

        File::shouldReceive('exists')
            ->once()
            ->andReturn(true);

        $job->handle();
    }
}
