<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Modules\Largo\Jobs\GenerateImageAnnotationSVGPatch;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationTest;
use Bus;
use Exception;
use FileCache;
use Log;
use Mockery;
use Storage;
use TestCase;

class GenerateImageAnnotationSVGPatchTest extends TestCase
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
        $annotation = ImageAnnotationTest::create([
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateImageAnnotationSVGPatchStub($annotation);
        $job->mock = $image;
        $test = $job->handleFile($annotation->image, 'abc');

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                .'xmlns:xlink="http://www.w3.org/1999/xlink" width="180" height="135" viewBox="0 0 197 148">'
                .'<circle cx="0" cy="0" r="1" vector-effect="non-scaling-stroke" isPoint="true" /></svg>';
        $this->assertEquals($svg, $content);
    }

    public function testHandleStorageConfigurableDisk()
    {
        Storage::fake('test2');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateImageAnnotationSVGPatchStub($annotation, 'test2');
        $job->mock = $image;
        $job->handleFile($annotation->image, 'abc');

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test2')->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                .'xmlns:xlink="http://www.w3.org/1999/xlink" width="180" height="135" viewBox="0 0 197 148">'
                .'<circle cx="0" cy="0" r="1" vector-effect="non-scaling-stroke" isPoint="true" /></svg>';
        $this->assertEquals($svg, $content);
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
        $job = new GenerateImageAnnotationSVGPatchStub($annotation);
        $job->mock = $image;
        $job->handleFile($annotation->image, 'abc');

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                .'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="26 26 148 148">'
                .'<circle cx="100" cy="100" r="1" vector-effect="non-scaling-stroke" isPoint="true" /></svg>';
        $this->assertEquals($svg, $content);
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
        $job = new GenerateImageAnnotationSVGPatchStub($annotation);
        $job->mock = $image;
        $job->handleFile($annotation->image, 'abc');

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                .'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 420 420">'
                .'<circle cx="300.4" cy="300.4" r="200" vector-effect="non-scaling-stroke" /></svg>';
        $this->assertEquals($svg, $content);
    }

    public function testHandleLine()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        Storage::fake('test');
        $image = $this->getImageMock();
        $annotation = ImageAnnotationTest::create([
            'points' => [1, 2, 2, 3, 3, 4],
            'shape_id' => Shape::lineId(),
        ]);

        $job = new GenerateImageAnnotationSVGPatchStub($annotation);
        $job->mock = $image;
        $job->handleFile($annotation->image, 'abc');


        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                . 'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="0 0 100 100"'
                . '><polyline points="1,2 2,3 3,4" vector-effect="non-scaling-stroke" stroke-linecap="round" /></svg>';
        $this->assertEquals($svg, $content);
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
        $job = new GenerateImageAnnotationSVGPatchStub($annotation);
        $job->mock = $image;
        $job->handleFile($annotation->image, 'abc');

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.svg");
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
        $job = new GenerateImageAnnotationSVGPatchStub($annotation);
        $job->mock = $image;
        $job->handleFile($annotation->image, 'abc');

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                . 'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="0 0 148 148">'
                .'<circle cx="0" cy="0" r="1" vector-effect="non-scaling-stroke" isPoint="true" /></svg>';
        $this->assertEquals($svg, $content);
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
        $job = new GenerateImageAnnotationSVGPatchStub($annotation);
        $job->mock = $image;
        $job->handleFile($annotation->image, 'abc');

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                .'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="852 602 148 148">'
                .'<circle cx="1000" cy="750" r="1" vector-effect="non-scaling-stroke" isPoint="true" /></svg>';
        $this->assertEquals($svg, $content);
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
        $job = new GenerateImageAnnotationSVGPatchStub($annotation);
        $job->mock = $image;
        $job->handleFile($annotation->image, 'abc');

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                . 'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="0 0 100 100">'
                .'<circle cx="50" cy="50" r="1" vector-effect="non-scaling-stroke" isPoint="true" /></svg>';
        $this->assertEquals($svg, $content);
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
        $job = new GenerateImageAnnotationSVGPatchStub($annotation);
        $job->mock = $image;
        $job->handleFile($annotation->image, 'abc');

        $prefix = fragment_uuid_path($annotation->image->uuid);
        $content = Storage::disk('test')->get("{$prefix}/{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" '
                . 'xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="10 10 100 100">'
                .'<circle cx="60" cy="60" r="10" vector-effect="non-scaling-stroke" /></svg>';
        $this->assertEquals($svg, $content);
    }

    public function testHandleError()
    {
        FileCache::shouldReceive('get')->andThrow(new Exception('error'));
        Log::shouldReceive('warning')->once();

        $annotation = ImageAnnotationTest::create();
        $annotation->shape_id = Shape::pointId();
        $job = new GenerateImageAnnotationSVGPatch($annotation);
        $job->handle();

        $prefix = fragment_uuid_path($annotation->image->uuid);
        Storage::disk('test')->assertMissing("{$prefix}/{$annotation->id}.svg");
    }

    public function testFileLockedError()
    {
        Bus::fake();
        FileCache::shouldReceive('get')->andThrow(FileLockedException::class);

        $annotation = ImageAnnotationTest::create();
        $annotation->shape_id = Shape::pointId();
        $job = new GenerateImageAnnotationSVGPatch($annotation);
        $job->handle();
        Bus::assertDispatched(GenerateImageAnnotationSVGPatch::class);

        $prefix = fragment_uuid_path($annotation->image->uuid);
        Storage::disk('test')->assertMissing("{$prefix}/{$annotation->id}.svg");
    }

    protected function getImageMock()
    {
        $image = Mockery::mock();
        $image->width = 1000;
        $image->height = 750;

        return $image;
    }
}

class GenerateImageAnnotationSVGPatchStub extends GenerateImageAnnotationSVGPatch
{
    public function getVipsImage($path)
    {
        return $this->mock;
    }
}
