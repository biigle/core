<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Modules\Largo\Jobs\GenerateVideoAnnotationPatch;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\Shape;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\VideoAnnotation;
use Bus;
use Exception;
use FFMpeg\Media\Video;
use File;
use FileCache;
use Log;
use Mockery;
use Storage;
use TestCase;

class GenerateVideoAnnotationPatchTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        config(['largo.patch_storage_disk' => 'test']);
    }

    public function testHandleStorage()
    {
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [],
            'frames' => [0, 10],
            'shape_id' => Shape::wholeFrameId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handleFile($annotation->video, 'abc');
        $prefix = fragment_uuid_path($annotation->video->uuid);

        $content = Storage::disk('test')->get("{$prefix}/v-{$annotation->id}.jpg");
        $this->assertEquals('abc123', $content);
    }

    public function testHandleStorageConfigurableDisk()
    {
        Storage::fake('test2');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [],
            'frames' => [0, 10],
            'shape_id' => Shape::wholeFrameId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation, 'test2');
        $job->mock = $video;

        $video->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handleFile($annotation->video, 'abc');
        $prefix = fragment_uuid_path($annotation->video->uuid);

        $content = Storage::disk('test2')->get("{$prefix}/v-{$annotation->id}.jpg");
        $this->assertEquals('abc123', $content);
    }

    public function testHandlePoint()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            // Should handle floats correctly.
            'points' => [[100.4, 100.4], [200, 200]],
            'frames' => [1, 2],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(26, 26, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleCircle()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            // Make the circle large enough so the crop is not affected by the minimum
            // dimension.
            'points' => [[300, 300, 200], [400, 400, 200]],
            'frames' => [1, 2],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(90, 90, 420, 420)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleOther()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            // Make the polygon large enough so the crop is not affected by the minimum
            // dimension.
            'points' => [
                [100, 100, 150, 200, 200, 100, 100, 100],
                [200, 200, 250, 300, 300, 200, 200, 200],
            ],
            'frames' => [1, 2],
            'shape_id' => Shape::polygonId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(90, 90, 120, 120)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
    }

    public function testHandleSingleFrame()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[100, 100]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(26, 26, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleContainedNegative()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[0, 0]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(0, 0, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleContainedPositive()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[1000, 750]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(852, 602, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleContainedTooLarge()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $video->width = 100;
        $video->height = 100;

        $annotation = VideoAnnotationTest::create([
            'points' => [[50, 50]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->once()
            ->with(0, 0, 100, 100)
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
        $this->assertEquals([1], $job->times);
    }

    public function testHandleMinDimension()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[60, 60, 10]],
            'frames' => [1],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(10, 10, 100, 100)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handleFile($annotation->video, 'abc');
    }

    public function testHandleError()
    {
        FileCache::shouldReceive('get')->andThrow(new Exception('error'));
        Log::shouldReceive('warning')->once();

        $annotation = VideoAnnotationTest::create();
        $job = new GenerateVideoAnnotationPatch($annotation);
        $job->handle();
    }

    public function testFileLockedError()
    {
        Bus::fake();
        FileCache::shouldReceive('get')->andThrow(FileLockedException::class);

        $annotation = VideoAnnotationTest::create();
        $job = new GenerateVideoAnnotationPatch($annotation);
        $job->handle();
        Bus::assertDispatched(GenerateVideoAnnotationPatch::class);
    }

    public function testGenerateFeatureVectorNew()
    {
        Storage::fake('test');
        $video = $this->getFrameMock();
        $video->shouldReceive('crop')->andReturn($video);
        $video->shouldReceive('writeToBuffer')->andReturn('abc123');
        $annotation = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;
        $job->output = [[$annotation->id, '"'.json_encode(range(0, 383)).'"']];
        $job->handleFile($annotation->video, 'abc');

        $input = $job->input;
        $this->assertCount(1, $input);
        $filename = array_keys($input)[0];
        $this->assertArrayHasKey($annotation->id, $input[$filename]);
        $box = $input[$filename][$annotation->id];
        $this->assertEquals([88, 88, 312, 312], $box);

        $vectors = VideoAnnotationLabelFeatureVector::where('annotation_id', $annotation->id)->get();
        $this->assertCount(1, $vectors);
        $this->assertEquals($annotationLabel->id, $vectors[0]->id);
        $this->assertEquals($annotationLabel->label_id, $vectors[0]->label_id);
        $this->assertEquals($annotationLabel->label->label_tree_id, $vectors[0]->label_tree_id);
        $this->assertEquals($annotation->video->volume_id, $vectors[0]->volume_id);
        $this->assertEquals(range(0, 383), $vectors[0]->vector->toArray());
    }

    public function testGenerateFeatureVectorManyLabels()
    {
        Storage::fake('test');
        $video = $this->getFrameMock();
        $video->shouldReceive('crop')->andReturn($video);
        $video->shouldReceive('writeToBuffer')->andReturn('abc123');
        $annotation = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $annotationLabel1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $annotationLabel2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;
        $job->output = [[$annotation->id, '"'.json_encode(range(0, 383)).'"']];
        $job->handleFile($annotation->video, 'abc');

        $vectors = VideoAnnotationLabelFeatureVector::where('annotation_id', $annotation->id)->get();
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
        $video = $this->getFrameMock();
        $video->shouldReceive('crop')->andReturn($video);
        $video->shouldReceive('writeToBuffer')->andReturn('abc123');
        $annotation = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $iafv = VideoAnnotationLabelFeatureVector::factory()->create([
            'id' => $annotationLabel->id,
            'annotation_id' => $annotation->id,
            'vector' => range(0, 383),
        ]);

        $annotationLabel2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $iafv2 = VideoAnnotationLabelFeatureVector::factory()->create([
            'id' => $annotationLabel2->id,
            'annotation_id' => $annotation->id,
            'vector' => range(0, 383),
        ]);

        $job = new GenerateVideoAnnotationPatchStub($annotation);
        $job->mock = $video;
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];
        $job->handleFile($annotation->video, 'abc');

        $count = VideoAnnotationLabelFeatureVector::count();
        $this->assertEquals(2, $count);
        $this->assertEquals(range(1, 384), $iafv->fresh()->vector->toArray());
        $this->assertEquals(range(1, 384), $iafv2->fresh()->vector->toArray());
    }

    protected function getFrameMock($times = 1)
    {
        $video = Mockery::mock();
        $video->width = 1000;
        $video->height = 750;
        $video->shouldReceive('resize')
            ->times($times)
            ->andReturn($video);
        $video->shouldReceive('writeToFile');

        return $video;
    }
}

class GenerateVideoAnnotationPatchStub extends GenerateVideoAnnotationPatch
{
    public $times = [];
    public $input;
    public $outputPath;
    public $output = [];

    public function getVideo($path)
    {
        return Mockery::mock(Video::class);
    }

    public function getVideoFrame(Video $video, $time)
    {
        $this->times[] = $time;

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
