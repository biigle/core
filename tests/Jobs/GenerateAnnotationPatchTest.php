<?php


namespace Dias\Tests\Modules\Ate\Jobs;

use App;
use File;
use Mockery;
use TestCase;
use Dias\Shape;
use Intervention\Image\Image;
use Dias\Tests\AnnotationTest;
use Intervention\Image\ImageCache;
use Intervention\Image\ImageManager;
use Dias\Modules\Ate\Jobs\GenerateAnnotationPatch;

class AteModuleJobsGenerateAnnotationPatchTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->image = Mockery::mock(Image::class);
        // default encoding of cached image
        $this->image->shouldReceive('encode')
            ->with()
            ->once()
            ->andReturn($this->image);

        $this->manager = Mockery::mock(ImageManager::class);

        App::bind(ImageCache::class, function () {
            return new ImageCache($this->manager);
        });
    }

    public function testHandlePoint()
    {
        $annotation = AnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::$pointId,
        ]);
        $job = new GenerateAnnotationPatch($annotation);

        $this->manager->shouldReceive('make')
            ->with($annotation->image->url)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('crop')
            ->with(197, 148, 1, 26)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('encode')
            ->with('jpg')
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('save')
            ->with(config('ate.patch_storage').'/'.$annotation->image->transect_id.'/'.$annotation->id.'.jpg')
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

        $this->manager->shouldReceive('make')
            ->with($annotation->image->url)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('crop')
            ->with(80, 60, 60, 70)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('encode')
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
        $padding = config('ate.patch_padding');
        $annotation = AnnotationTest::create([
            'points' => [100, 100, 100, 200, 200, 200, 200, 100],
            'shape_id' => Shape::$rectangleId,
        ]);
        $job = new GenerateAnnotationPatch($annotation);

        $this->manager->shouldReceive('make')
            ->with($annotation->image->url)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('crop')
            ->with(160, 120, 70, 90)
            ->once()
            ->andReturn($this->image);

        $this->image->shouldReceive('encode')
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
