<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Image;
use Biigle\Modules\Largo\Exceptions\ProcessAnnotatedFileException;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Bus;
use Exception;
use File;
use FileCache;
use Jcupitt\Vips\Image as VipsImage;
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
        $this->assertSame('abc123', $content);
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
        $this->assertSame('abc123', $content);
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
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="26 26 148 148"><g><circle cx="100" cy="100" r="6" fill="#fff" /><circle cx="100" cy="100" r="5" fill="#666" /></g></svg>';
        $this->assertSame($svg, $content);
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
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 420 420"><g><circle cx="300.4" cy="300.4" r="200" fill="none" vector-effect="non-scaling-stroke" stroke="#fff" stroke-width="5px" /><circle cx="300.4" cy="300.4" r="200" fill="none" vector-effect="non-scaling-stroke" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandlePolygon()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'points' => [300, 300, 200, 200, 300, 200, 300, 300],
            'shape_id' => Shape::polygonId(),
        ]);
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(190, 190, 120, 120)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = $disk->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="190 190 120 120"><g><polygon points="300,300 200,200 300,200 300,300" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#fff" stroke-width="5px" /><polygon points="300,300 200,200 300,200 300,300" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandleLineString()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'points' => [300, 300, 200, 200, 300, 200],
            'shape_id' => Shape::lineId(),
        ]);
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->with(190, 190, 120, 120)
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = $disk->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="190 190 120 120"><g><polyline points="300,300 200,200 300,200" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke="#fff" stroke-width="5px" /><polyline points="300,300 200,200 300,200" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandleRectangle()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            // Make the rectangle large enough so the crop is not affected by the minimum
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
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 220 220"><g><rect x="100" y="100" width="200" height="200" transform="rotate(0,100,100)" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#fff" stroke-width="5px" /><rect x="100" y="100" width="200" height="200" transform="rotate(0,100,100)" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandleEllipse()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'points' => [100, 100, 100, 300, 300, 300, 300, 100],
            'shape_id' => Shape::ellipseId(),
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
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 220 220"><g><ellipse cx="200" cy="100" rx="100" ry="0" transform="rotate(0,200,100)" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#fff" stroke-width="5px" /><ellipse cx="200" cy="100" rx="100" ry="0" transform="rotate(0,200,100)" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
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

        $annotation = ImageAnnotationTest::create();
        $job = new ProcessAnnotatedImage($annotation->image);
        $job->tries = 1;
        try {
            $job->handle();
            $this->fail('An exception should be thrown.');
        } catch (ProcessAnnotatedFileException $e) {
            $prefix = fragment_uuid_path($annotation->image->uuid);
            $disk->assertMissing("{$prefix}/{$annotation->id}.svg");
        }
    }

    public function testHandleGiveUpError()
    {
        $disk = Storage::fake('test');
        FileCache::shouldReceive('get')->andThrow(new Exception('cURL error 60:'));
        Log::shouldReceive('warning')->once();

        $annotation = ImageAnnotationTest::create();
        $job = new ProcessAnnotatedImage($annotation->image);
        $job->tries = 1;
        $job->handle();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $disk->assertMissing("{$prefix}/{$annotation->id}.svg");
    }

    public function testHandleGiveUpError2()
    {
        $disk = Storage::fake('test');
        FileCache::shouldReceive('get')->andThrow(new Exception("MIME type 'text/html' not allowed"));
        Log::shouldReceive('warning')->once();

        $annotation = ImageAnnotationTest::create();
        $job = new ProcessAnnotatedImage($annotation->image);
        $job->tries = 1;
        $job->handle();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $disk->assertMissing("{$prefix}/{$annotation->id}.svg");
    }

    public function testHandleGiveUpError3()
    {
        $disk = Storage::fake('test');
        FileCache::shouldReceive('get')->andThrow(new Exception('Disk [disk-10] does not have a configured driver.'));
        Log::shouldReceive('warning')->once();

        $annotation = ImageAnnotationTest::create();
        $job = new ProcessAnnotatedImage($annotation->image);
        $job->tries = 1;
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
        $this->assertSame([88, 88, 312, 312], $box);

        $vectors = ImageAnnotationLabelFeatureVector::where('annotation_id', $annotation->id)->get();
        $this->assertCount(1, $vectors);
        $this->assertSame($annotationLabel->id, $vectors[0]->id);
        $this->assertSame($annotationLabel->label_id, $vectors[0]->label_id);
        $this->assertSame($annotationLabel->label->label_tree_id, $vectors[0]->label_tree_id);
        $this->assertSame($annotation->image->volume_id, $vectors[0]->volume_id);
        $this->assertSame(range(0, 383), $vectors[0]->vector->toArray());
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
        $this->assertSame($annotationLabel1->id, $vectors[0]->id);
        $this->assertSame($annotationLabel1->label_id, $vectors[0]->label_id);
        $this->assertSame(range(0, 383), $vectors[0]->vector->toArray());

        $this->assertSame($annotationLabel2->id, $vectors[1]->id);
        $this->assertSame($annotationLabel2->label_id, $vectors[1]->label_id);
        $this->assertSame(range(0, 383), $vectors[1]->vector->toArray());
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
        $this->assertSame(2, $count);
        $this->assertSame(range(1, 384), $iafv->fresh()->vector->toArray());
        $this->assertSame(range(1, 384), $iafv2->fresh()->vector->toArray());
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
        $this->assertSame(0, ImageAnnotationLabelFeatureVector::count());
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
        $this->assertSame(1, ImageAnnotationLabelFeatureVector::count());
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
        $this->assertSame(0, ImageAnnotationLabelFeatureVector::count());
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
        $this->assertSame(2, ImageAnnotationLabelFeatureVector::count());
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
        $this->assertSame(1, ImageAnnotationLabelFeatureVector::count());
    }

    public function testHandleInvalidShape()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        $disk = Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            // This is a real-world example where someone managed to create a zero-sized
            // rectangle.
            'points' => [844.69,1028.44,844.69,1028.44,844.69,1028.44,844.69,1028.44],
            'shape_id' => Shape::rectangleId(),
        ]);
        $job = new ProcessAnnotatedImageStub($annotation->image);
        $job->mock = $image;

        $image->shouldReceive('crop')
            ->once()
            ->andReturn($image);

        $image->shouldReceive('writeToBuffer')->once()->andReturn('abc123');

        // Assert that no exception is thrown
        $job->handle();

    }

    public function testHandleFeatureVectorTiledImage()
    {
        $vipsImage = $this->getImageMock(0);
        $vipsImage->shouldReceive('crop')
            ->once()
            ->with(19888, 19888, 224, 224)
            ->andReturn($vipsImage);
        $vipsImage->shouldReceive('pngsave')->once()->andReturn($vipsImage);

        $disk = Storage::fake('test');
        $image = Image::factory()->create([
            'attrs' => ['width' => 40000, 'height' => 40000],
            'tiled' => true,
        ]);
        $annotation = ImageAnnotationTest::create([
            'points' => [20000, 20000],
            'shape_id' => Shape::pointId(),
            'image_id' => $image->id,
        ]);
        ImageAnnotationLabelTest::create(['annotation_id' => $annotation->id]);
        $job = new ProcessAnnotatedImageStub($image,
            skipPatches: true,
            skipSvgs: true
        );
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];
        $job->mock = $vipsImage;

        $job->handle();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $this->assertSame(1, ImageAnnotationLabelFeatureVector::count());

        $input = $job->input;
        $this->assertCount(1, $input);
        $filename = array_keys($input)[0];
        $this->assertArrayHasKey($annotation->id, $input[$filename]);
        $box = $input[$filename][$annotation->id];
        // These are the coordinates of the cropped image.
        $this->assertSame([0, 0, 224, 224], $box);
    }

    public function testHandleFeatureVectorTiledImageLargePatch()
    {
        $vipsImage = $this->getImageMock(0);
        $vipsImage->shouldReceive('crop')
            ->once()
            ->with(0, 0, 10000, 10000)
            ->andReturn($vipsImage);
        $vipsImage->shouldReceive('resize')
            ->once()
            ->with(0.5)
            ->andReturn($vipsImage);
        $vipsImage->shouldReceive('pngsave')->once()->andReturn($vipsImage);

        $disk = Storage::fake('test');
        $image = Image::factory()->create([
            'attrs' => ['width' => 40000, 'height' => 40000],
            'tiled' => true,
        ]);
        $annotation = ImageAnnotationTest::create([
            'points' => [0, 0, 10000, 0, 10000, 10000, 0, 10000, 0, 0],
            'shape_id' => Shape::polygonId(),
            'image_id' => $image->id,
        ]);
        ImageAnnotationLabelTest::create(['annotation_id' => $annotation->id]);
        $job = new ProcessAnnotatedImageStub($image,
            skipPatches: true,
            skipSvgs: true
        );
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];
        $job->mock = $vipsImage;

        $job->handle();
        $prefix = fragment_uuid_path($annotation->image->uuid);
        $this->assertSame(1, ImageAnnotationLabelFeatureVector::count());

        $input = $job->input;
        $this->assertCount(1, $input);
        $filename = array_keys($input)[0];
        $this->assertArrayHasKey($annotation->id, $input[$filename]);
        $box = $input[$filename][$annotation->id];
        // These are the coordinates of the cropped image.
        $this->assertSame([0, 0, 5000, 5000], $box);
    }

    public function testHandleFlatLineStringVector()
    {
        $image = $this->getImageMock(0);
        $annotation = ImageAnnotationTest::create([
            'points' => [300, 300, 400, 300],
            'shape_id' => Shape::lineId(),
        ]);
        $job = new ProcessAnnotatedImageStub($annotation->image, skipPatches: true, skipSvgs: true);
        $job->mock = $image;

        $job->handle();

        $input = $job->input;
        $filename = array_keys($input)[0];
        $box = $input[$filename][$annotation->id];
        // The height is padded to ensure a minimum size of 32 px.
        $this->assertSame([300, 284, 400, 316], $box);
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

    public function getVipsImage(string $path, array $options = [])
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
