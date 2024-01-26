<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
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

class ProcessAnnotatedImageTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        config(['largo.patch_storage_disk' => 'test']);
        FileCache::fake();
    }

    public function testHandleStorage()
    {
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create(['shape_id' => Shape::pointId()]);
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->andReturn($image);
        $image->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handle();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = $disk->get("{$prefix}/{$annotation->id}.jpg");
        $this->assertEquals('abc123', $content);
        $disk->assertExists("{$prefix}/{$annotation->id}.svg");
    }

    public function testHandleStorageConfigurableDisk()
    {
        $disk = Storage::fake('test2');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create(['shape_id' => Shape::pointId()]);
        $job = new ProcessAnnotatedImageStub($annotation->image, targetDisk: 'test2');
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->andReturn($image);
        $image->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handle();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = $disk->get("{$prefix}/{$annotation->id}.jpg");
        $this->assertEquals('abc123', $content);
        $disk->assertExists("{$prefix}/{$annotation->id}.svg");
    }

    public function testHandlePoint()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(26, 26, 148, 148)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = $disk->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                .'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="26 26 148 148">'
                .'<circle cx="100" cy="100" r="3" vector-effect="non-scaling-stroke" isPoint="true" /></svg>';
        $this->assertEquals($svg, $content);
    }

    public function testHandleCircle()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            // Should handle floats correctly.
            // Make the circle large enough so the crop is not affected by the minimum
            // dimension.
            'points' => [300.4, 300.4, 200],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(90, 90, 420, 420)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = $disk->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                .'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 420 420">'
                .'<circle cx="300.4" cy="300.4" r="200" vector-effect="non-scaling-stroke" /></svg>';
        $this->assertEquals($svg, $content);
    }

    public function testHandleOther()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            // Make the polygon large enough so the crop is not affected by the minimum
            // dimension.
            'points' => [100, 100, 100, 300, 300, 300, 300, 100],
            'shape_id' => Shape::rectangleId(),
        ]);
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(90, 90, 220, 220)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = $disk->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                .'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 220 220">'
                .'<rect x="100" y="100" width="200" height="200" transform="rotate(0,100,100)" vector-effect="non-scaling-stroke" /></svg>';
        $this->assertEquals($svg, $content);
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
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->with(0, 0, 148, 148)
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
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
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->with(852, 602, 148, 148)
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
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
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->with(0, 0, 100, 100)
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
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
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(10, 10, 100, 100)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
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
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(0, 0, 25, 25)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
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
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(0, 0, 25, 25)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
    }

    public function testHandleError()
    {
        $disk = Storage::fake('test');
        FileCache::shouldReceive('get')->andThrow(new Exception('error'));
        Log::shouldReceive('warning')->once();

        $annotation = ImageAnnotationTest::create();
        $job = new ProcessAnnotatedImage($annotation->image);
        $job->handle();

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $disk->assertMissing("{$prefix}/{$annotation->id}.svg");
    }

    public function testFileLockedError()
    {
        $disk = Storage::fake('test');
        Bus::fake();
        FileCache::shouldReceive('get')->andThrow(FileLockedException::class);

        $annotation = ImageAnnotationTest::create();
        $job = new ProcessAnnotatedImage($annotation->image);
        $job->handle();
        Bus::assertDispatched(ProcessAnnotatedImage::class);

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $disk->assertMissing("{$prefix}/{$annotation->id}.svg");
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
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;
        $job->output = [[$annotation->id, '"'.json_encode(range(0, 383)).'"']];
        $job->handle();

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

    public function testGenerateFeatureVectorManyLabels()
    {
        Storage::fake('test');
        $image = $this->getImageMock();
        $image->shouldReceive('crop')->andReturn($image);
        $image->shouldReceive('writeToBuffer')->andReturn('abc123');
        $annotation = ImageAnnotationTest::create([
            'points' => [200, 200],
            'shape_id' => Shape::pointId(),
        ]);
        $annotationLabel1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $annotationLabel2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;
        $job->output = [[$annotation->id, '"'.json_encode(range(0, 383)).'"']];
        $job->handle();

        $vectors = ImageAnnotationLabelFeatureVector::where('annotation_id', $annotation->id)->get();
        $this->assertCount(2, $vectors);
        $this->assertEquals($annotationLabel1->id, $vectors[0]->id);
        $this->assertEquals($annotationLabel1->label_id, $vectors[0]->label_id);
        $this->assertEquals(range(0, 383), $vectors[0]->vector->toArray());

        $this->assertEquals($annotationLabel2->id, $vectors[1]->id);
        $this->assertEquals($annotationLabel2->label_id, $vectors[1]->label_id);
        $this->assertEquals(range(0, 383), $vectors[1]->vector->toArray());
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

        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];
        $job->handle();

        $count = ImageAnnotationLabelFeatureVector::count();
        $this->assertEquals(2, $count);
        $this->assertEquals(range(1, 384), $iafv->fresh()->vector->toArray());
        $this->assertEquals(range(1, 384), $iafv2->fresh()->vector->toArray());
    }

    public function testHandlePatchOnly()
    {
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $image->shouldReceive('crop')->andReturn($image);
        $image->shouldReceive('writeToBuffer')->andReturn('abc123');

        $annotation = ImageAnnotationTest::create([
            'points' => [200, 200],
            'shape_id' => Shape::pointId(),
        ]);
        ImageAnnotationLabelTest::create(['annotation_id' => $annotation->id]);
        $job = new ProcessAnnotatedImageStub($annotation->image,
            skipFeatureVectors: true,
            skipSvgs: true
        );
        $job->mock = $image;
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];

        $job->handle();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $disk->assertExists("{$prefix}/{$annotation->id}.jpg");
        $disk->assertMissing("{$prefix}/{$annotation->id}.svg");
        $this->assertEquals(0, ImageAnnotationLabelFeatureVector::count());
    }

    public function testHandleFeatureVectorOnly()
    {
        $disk = Storage::fake('test');
        $annotation = ImageAnnotationTest::create([
            'points' => [200, 200],
            'shape_id' => Shape::pointId(),
        ]);
        ImageAnnotationLabelTest::create(['annotation_id' => $annotation->id]);
        $job = new ProcessAnnotatedImageStub($annotation->image,
            skipPatches: true,
            skipSvgs: true
        );
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];

        $job->handle();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $disk->assertMissing("{$prefix}/{$annotation->id}.jpg");
        $disk->assertMissing("{$prefix}/{$annotation->id}.svg");
        $this->assertEquals(1, ImageAnnotationLabelFeatureVector::count());
    }

    public function testHandleSvgOnly()
    {
        FileCache::shouldReceive('get')->never();
        $disk = Storage::fake('test');

        $annotation = ImageAnnotationTest::create([
            'points' => [200, 200],
            'shape_id' => Shape::pointId(),
        ]);
        ImageAnnotationLabelTest::create(['annotation_id' => $annotation->id]);
        $job = new ProcessAnnotatedImageStub($annotation->image,
            skipFeatureVectors: true,
            skipPatches: true
        );
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];

        $job->handle();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $disk->assertMissing("{$prefix}/{$annotation->id}.jpg");
        $disk->assertExists("{$prefix}/{$annotation->id}.svg");
        $this->assertEquals(0, ImageAnnotationLabelFeatureVector::count());
    }

    public function testHandleMultipleAnnotations()
    {
        $disk = Storage::fake('test');
        $image = $this->getImageMock(2);
        $annotation1 = ImageAnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::pointId(),
        ]);
        ImageAnnotationLabelTest::create(['annotation_id' => $annotation1->id]);
        $annotation2 = ImageAnnotationTest::create([
            'points' => [120, 120],
            'shape_id' => Shape::pointId(),
            'image_id' => $annotation1->image_id,
        ]);
        ImageAnnotationLabelTest::create(['annotation_id' => $annotation2->id]);

        $job = new ProcessAnnotatedImageStub($annotation1->image);
        $job->output = [
            [$annotation1->id, '"'.json_encode(range(1, 384)).'"'],
            [$annotation2->id, '"'.json_encode(range(1, 384)).'"'],
        ];
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->twice()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->twice()->andReturn('abc123');
        $job->handle();
        $prefix = fragment_uuid_path($annotation1->image->uuid);
        $disk->assertExists("{$prefix}/{$annotation1->id}.jpg");
        $disk->assertExists("{$prefix}/{$annotation2->id}.jpg");
        $disk->assertExists("{$prefix}/{$annotation1->id}.svg");
        $disk->assertExists("{$prefix}/{$annotation2->id}.svg");
        $this->assertEquals(2, ImageAnnotationLabelFeatureVector::count());
    }

    public function testHandleOnlyAnnotations()
    {
        $disk = Storage::fake('test');
        $image = $this->getImageMock(1);
        $annotation1 = ImageAnnotationTest::create([
            'points' => [100, 100],
            'shape_id' => Shape::pointId(),
        ]);
        ImageAnnotationLabelTest::create(['annotation_id' => $annotation1->id]);
        $annotation2 = ImageAnnotationTest::create([
            'points' => [120, 120],
            'shape_id' => Shape::pointId(),
            'image_id' => $annotation1->image_id,
        ]);
        ImageAnnotationLabelTest::create(['annotation_id' => $annotation2->id]);

        $job = new ProcessAnnotatedImageStub($annotation1->image, only: [$annotation1->id]);
        $job->output = [[$annotation1->id, '"'.json_encode(range(1, 384)).'"']];
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
        $prefix = fragment_uuid_path($annotation1->image->uuid);
        $disk->assertExists("{$prefix}/{$annotation1->id}.jpg");
        $disk->assertExists("{$prefix}/{$annotation1->id}.svg");
        $disk->assertMissing("{$prefix}/{$annotation2->id}.jpg");
        $disk->assertMissing("{$prefix}/{$annotation2->id}.svg");
        $this->assertEquals(1, ImageAnnotationLabelFeatureVector::count());
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

class ProcessAnnotatedImageStub extends ProcessAnnotatedImage
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
