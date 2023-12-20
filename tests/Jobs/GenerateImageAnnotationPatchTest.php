<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\Jobs\GenerateImageAnnotationPatch;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Bus;
use Exception;
use File;
use FileCache;
use Jcupitt\Vips\Image;
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
        $annotation = ImageAnnotationTest::create();
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
        $annotation = ImageAnnotationTest::create();
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

    public function testHandleContainedNegativeProblematic()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $image->width = 25;
        $image->height = 25;
        $annotation = ImageAnnotationTest::create([
            'points' => [10, 10, 15],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(0, 0, 25, 25)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->image, 'abc');
    }

    public function testHandleContainedPositiveProblematic()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $image->width = 25;
        $image->height = 25;
        $annotation = ImageAnnotationTest::create([
            'points' => [15, 15, 15],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(0, 0, 25, 25)
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
        $job = new GenerateImageAnnotationPatch($annotation);
        $job->handle();
    }

    public function testFileLockedError()
    {
        Bus::fake();
        FileCache::shouldReceive('get')->andThrow(FileLockedException::class);

        $annotation = ImageAnnotationTest::create();
        $job = new GenerateImageAnnotationPatch($annotation);
        $job->handle();
        Bus::assertDispatched(GenerateImageAnnotationPatch::class);
    }

    public function testGenerateFeatureVectorNew()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $image->shouldReceive('crop')->andReturn($image);
        $image->shouldReceive('writeToBuffer')->andReturn('abc123');
        $annotation = ImageAnnotationTest::create([
            'points' => [200, 200],
            'shape_id' => Shape::pointId(),
        ]);
        $annotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;
        $job->output = [[$annotation->id, '"'.json_encode(range(0, 383)).'"']];
        $job->handleFile($annotation->image, 'abc');

        $input = $job->input;
        $this->assertCount(1, $input);
        $filename = array_keys($input)[0];
        $this->assertArrayHasKey($annotation->id, $input[$filename]);
        $box = $input[$filename][$annotation->id];
        $this->assertEquals([88, 88, 312, 312], $box);

        $vectors = ImageAnnotationLabelFeatureVector::where('annotation_id', $annotation->id)->get();
        $this->assertCount(1, $vectors);
        $this->assertEquals($annotationLabel->id, $vectors[0]->id);
        $this->assertEquals($annotationLabel->label_id, $vectors[0]->label_id);
        $this->assertEquals($annotationLabel->label->label_tree_id, $vectors[0]->label_tree_id);
        $this->assertEquals($annotation->image->volume_id, $vectors[0]->volume_id);
        $this->assertEquals(range(0, 383), $vectors[0]->vector->toArray());
    }

    public function testGenerateFeatureVectorUpdate()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $image->shouldReceive('crop')->andReturn($image);
        $image->shouldReceive('writeToBuffer')->andReturn('abc123');
        $annotation = ImageAnnotationTest::create([
            'points' => [200, 200],
            'shape_id' => Shape::pointId(),
        ]);
        $annotationLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $iafv = ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $annotationLabel->id,
            'annotation_id' => $annotation->id,
            'vector' => range(0, 383),
        ]);

        $annotationLabel2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $iafv2 = ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $annotationLabel2->id,
            'annotation_id' => $annotation->id,
            'vector' => range(0, 383),
        ]);

        $job = new GenerateImageAnnotationPatchStub($annotation);
        $job->mock = $image;
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];
        $job->handleFile($annotation->image, 'abc');

        $count = ImageAnnotationLabelFeatureVector::count();
        $this->assertEquals(2, $count);
        $this->assertEquals(range(1, 384), $iafv->fresh()->vector->toArray());
        $this->assertEquals(range(1, 384), $iafv2->fresh()->vector->toArray());
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
    public $input;
    public $outputPath;
    public $output = [];

    public function getVipsImage($path)
    {
        return $this->mock;
    }

    protected function python(string $inputPath, string $outputPath)
    {
        $this->input = json_decode(File::get($inputPath), true);
        $this->outputPath = $outputPath;
        $csv = implode("\n", array_map(fn ($row) => implode(',', $row), $this->output));
        File::put($outputPath, $csv);
    }
}
