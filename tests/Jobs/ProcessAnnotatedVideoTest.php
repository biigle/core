<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\Modules\Largo\Exceptions\ProcessAnnotatedFileException;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\Shape;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Video as VideoModel;
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

class ProcessAnnotatedVideoTest extends TestCase
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
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [],
            'frames' => [0, 10],
            'shape_id' => Shape::wholeFrameId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handle();
        $prefix = fragment_uuid_path($annotation->video->uuid);

        $content = $disk->get("{$prefix}/v-{$annotation->id}.jpg");
        $this->assertSame('abc123', $content);
        // SVGs are not generated for whole frame annotations.
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.svg");
    }

    public function testHandleStorageConfigurableDisk()
    {
        $disk = Storage::fake('test2');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [],
            'frames' => [0, 10],
            'shape_id' => Shape::wholeFrameId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video, targetDisk: 'test2');
        $job->mock = $video;

        $video->shouldReceive('writeToBuffer')
            ->with('.jpg', ['Q' => 85, 'strip' => true])
            ->once()
            ->andReturn('abc123');

        $job->handle();
        $prefix = fragment_uuid_path($annotation->video->uuid);

        $content = $disk->get("{$prefix}/v-{$annotation->id}.jpg");
        $this->assertSame('abc123', $content);
        // SVGs are not generated for whole frame annotations.
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.svg");
    }

    public function testHandlePoint()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        $disk = Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            // Should handle floats correctly.
            'points' => [[100.4, 100.4], [200, 200]],
            'frames' => [1, 2],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(26, 26, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
        $this->assertSame([1.0], $job->times);

        $prefix = fragment_uuid_path($annotation->video->uuid);
        $content = $disk->get("{$prefix}/v-{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="26 26 148 148"><g><circle cx="100.4" cy="100.4" r="6" fill="#fff" /><circle cx="100.4" cy="100.4" r="5" fill="#666" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandleCircle()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        $disk = Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            // Make the circle large enough so the crop is not affected by the minimum
            // dimension.
            'points' => [[300, 300, 200], [400, 400, 200]],
            'frames' => [1, 2],
            'shape_id' => Shape::circleId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(90, 90, 420, 420)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
        $this->assertSame([1.0], $job->times);

        $prefix = fragment_uuid_path($annotation->video->uuid);
        $content = $disk->get("{$prefix}/v-{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 420 420"><g><circle cx="300" cy="300" r="200" fill="none" vector-effect="non-scaling-stroke" stroke="#fff" stroke-width="5px" /><circle cx="300" cy="300" r="200" fill="none" vector-effect="non-scaling-stroke" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandlePolygon()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        $disk = Storage::fake('test');
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
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(90, 90, 120, 120)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();

        $prefix = fragment_uuid_path($annotation->video->uuid);
        $content = $disk->get("{$prefix}/v-{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 120 120"><g><polygon points="100,100 150,200 200,100 100,100" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#fff" stroke-width="5px" /><polygon points="100,100 150,200 200,100 100,100" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandleLineString()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        $disk = Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [
                [100, 100, 150, 200, 200, 100],
                [200, 200, 250, 300, 300, 200],
            ],
            'frames' => [1, 2],
            'shape_id' => Shape::lineId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(90, 90, 120, 120)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();

        $prefix = fragment_uuid_path($annotation->video->uuid);
        $content = $disk->get("{$prefix}/v-{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 120 120"><g><polyline points="100,100 150,200 200,100" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke="#fff" stroke-width="5px" /><polyline points="100,100 150,200 200,100" fill="none" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandleRectangle()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        $disk = Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[100, 100, 100, 300, 300, 300, 300, 100]],
            'frames' => [1],
            'shape_id' => Shape::rectangleId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(90, 90, 220, 220)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();

        $prefix = fragment_uuid_path($annotation->video->uuid);
        $content = $disk->get("{$prefix}/v-{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 220 220"><g><rect x="100" y="100" width="200" height="200" transform="rotate(0,100,100)" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#fff" stroke-width="5px" /><rect x="100" y="100" width="200" height="200" transform="rotate(0,100,100)" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandleEllipse()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        $disk = Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[100, 100, 100, 300, 300, 300, 300, 100]],
            'frames' => [1],
            'shape_id' => Shape::ellipseId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(90, 90, 220, 220)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();

        $prefix = fragment_uuid_path($annotation->video->uuid);
        $content = $disk->get("{$prefix}/v-{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="90 90 220 220"><g><ellipse cx="200" cy="100" rx="100" ry="0" transform="rotate(0,200,100)" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#fff" stroke-width="5px" /><ellipse cx="200" cy="100" rx="100" ry="0" transform="rotate(0,200,100)" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke="#666" stroke-width="3px" /></g></svg>';
        $this->assertSame($svg, $content);
    }

    public function testHandleSingleFrame()
    {
        config([
            'thumbnails.height' => 100,
            'thumbnails.width' => 100,
        ]);
        $disk = Storage::fake('test');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            'points' => [[100, 100]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(26, 26, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
        $this->assertSame([1.0], $job->times);

        $prefix = fragment_uuid_path($annotation->video->uuid);
        $content = $disk->get("{$prefix}/v-{$annotation->id}.svg");
        $svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="26 26 148 148"><g><circle cx="100" cy="100" r="6" fill="#fff" /><circle cx="100" cy="100" r="5" fill="#666" /></g></svg>';
        $this->assertSame($svg, $content);
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
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(0, 0, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
        $this->assertSame([1.0], $job->times);
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
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(852, 602, 148, 148)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
        $this->assertSame([1.0], $job->times);
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
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->once()
            ->with(0, 0, 100, 100)
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
        $this->assertSame([1.0], $job->times);
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
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->with(10, 10, 100, 100)
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
    }

    public function testHandleError()
    {
        $disk = Storage::fake('test');
        FileCache::shouldReceive('get')->andThrow(new Exception('error'));

        $annotation = VideoAnnotationTest::create();
        $job = new ProcessAnnotatedVideo($annotation->video);
        $job->tries = 1;
        try {
            $job->handle();
            $this->fail('An exception should be thrown.');
        } catch (ProcessAnnotatedFileException $e) {
            $prefix = fragment_uuid_path($annotation->video->uuid);
            $disk->assertMissing("{$prefix}/v-{$annotation->id}.svg");
        }
    }

    public function testHandleGiveUpError()
    {
        $disk = Storage::fake('test');
        FileCache::shouldReceive('get')->andThrow(new Exception('cURL error 60:'));
        Log::shouldReceive('warning')->once();

        $annotation = VideoAnnotationTest::create();
        $job = new ProcessAnnotatedVideo($annotation->video);
        $job->tries = 1;
        $job->handle();
        $prefix = fragment_uuid_path($annotation->video->uuid);
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.svg");
    }

    public function testHandleGiveUpError2()
    {
        $disk = Storage::fake('test');
        FileCache::shouldReceive('get')->andThrow(new Exception("MIME type 'text/html' not allowed"));
        Log::shouldReceive('warning')->once();

        $annotation = VideoAnnotationTest::create();
        $job = new ProcessAnnotatedVideo($annotation->video);
        $job->tries = 1;
        $job->handle();
        $prefix = fragment_uuid_path($annotation->video->uuid);
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.svg");
    }

    public function testHandleGiveUpError3()
    {
        $disk = Storage::fake('test');
        FileCache::shouldReceive('get')->andThrow(new Exception('Disk [disk-10] does not have a configured driver.'));
        Log::shouldReceive('warning')->once();

        $annotation = VideoAnnotationTest::create();
        $job = new ProcessAnnotatedVideo($annotation->video);
        $job->tries = 1;
        $job->handle();
        $prefix = fragment_uuid_path($annotation->video->uuid);
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.svg");
    }

    public function testFileLockedError()
    {
        $disk = Storage::fake('test');
        Bus::fake();
        FileCache::shouldReceive('get')->andThrow(FileLockedException::class);

        $annotation = VideoAnnotationTest::create();
        $job = new ProcessAnnotatedVideo($annotation->video);
        $job->handle();
        Bus::assertDispatched(ProcessAnnotatedVideo::class);
        $prefix = fragment_uuid_path($annotation->video->uuid);
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.svg");
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
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;
        $job->output = [[$annotation->id, '"'.json_encode(range(0, 383)).'"']];
        $job->handle();

        $input = $job->input;
        $this->assertCount(1, $input);
        $filename = array_keys($input)[0];
        $this->assertArrayHasKey($annotation->id, $input[$filename]);
        $box = $input[$filename][$annotation->id];
        $this->assertSame([88, 88, 312, 312], $box);

        $vectors = VideoAnnotationLabelFeatureVector::where('annotation_id', $annotation->id)->get();
        $this->assertCount(1, $vectors);
        $this->assertSame($annotationLabel->id, $vectors[0]->id);
        $this->assertSame($annotationLabel->label_id, $vectors[0]->label_id);
        $this->assertSame($annotationLabel->label->label_tree_id, $vectors[0]->label_tree_id);
        $this->assertSame($annotation->video->volume_id, $vectors[0]->volume_id);
        $this->assertSame(range(0, 383), $vectors[0]->vector->toArray());
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
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;
        $job->output = [[$annotation->id, '"'.json_encode(range(0, 383)).'"']];
        $job->handle();

        $vectors = VideoAnnotationLabelFeatureVector::where('annotation_id', $annotation->id)->get();
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

        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];
        $job->handle();

        $count = VideoAnnotationLabelFeatureVector::count();
        $this->assertSame(2, $count);
        $this->assertSame(range(1, 384), $iafv->fresh()->vector->toArray());
        $this->assertSame(range(1, 384), $iafv2->fresh()->vector->toArray());
    }

    public function testGenerateFeatureVectorWholeFrame()
    {
        Storage::fake('test');
        $videoMock = $this->getFrameMock();
        $videoMock->shouldReceive('crop')->andReturn($videoMock);
        $videoMock->shouldReceive('writeToBuffer')->andReturn('abc123');

        $video = VideoModel::factory()->create([
            'attrs' => ['width' => 1000, 'height' => 750],
        ]);
        $annotation = VideoAnnotationTest::create([
            'points' => [],
            'frames' => [1],
            'shape_id' => Shape::wholeFrameId(),
            'video_id' => $video->id,
        ]);
        $annotationLabel = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $videoMock;
        $job->output = [[$annotation->id, '"'.json_encode(range(0, 383)).'"']];
        $job->handleFile($video, 'abc');

        $input = $job->input;
        $this->assertCount(1, $input);
        $filename = array_keys($input)[0];
        $this->assertArrayHasKey($annotation->id, $input[$filename]);
        $box = $input[$filename][$annotation->id];
        $this->assertSame([0, 0, 1000, 750], $box);
    }

    public function testHandlePatchOnly()
    {
        $disk = Storage::fake('test');
        $video = $this->getFrameMock();
        $video->shouldReceive('crop')->andReturn($video);
        $video->shouldReceive('writeToBuffer')->andReturn('abc123');

        $annotation = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        VideoAnnotationLabelTest::create(['annotation_id' => $annotation->id]);
        $job = new ProcessAnnotatedVideoStub($annotation->video,
            skipFeatureVectors: true,
            skipSvgs: true
        );
        $job->mock = $video;
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];

        $job->handle();
        $prefix = fragment_uuid_path($annotation->video->uuid);
        $disk->assertExists("{$prefix}/v-{$annotation->id}.jpg");
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.svg");
        $this->assertSame(0, VideoAnnotationLabelFeatureVector::count());
    }

    public function testHandleFeatureVectorOnly()
    {
        $disk = Storage::fake('test');
        $video = $this->getFrameMock(0);
        $annotation = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        VideoAnnotationLabelTest::create(['annotation_id' => $annotation->id]);
        $job = new ProcessAnnotatedVideoStub($annotation->video,
            skipPatches: true,
            skipSvgs: true
        );
        $job->mock = $video;
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];

        $job->handle();
        $prefix = fragment_uuid_path($annotation->video->uuid);
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.jpg");
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.svg");
        $this->assertSame(1, VideoAnnotationLabelFeatureVector::count());
    }

    public function testHandleSvgOnly()
    {
        FileCache::shouldReceive('get')->never();
        $disk = Storage::fake('test');
        $video = $this->getFrameMock(0);
        $annotation = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        VideoAnnotationLabelTest::create(['annotation_id' => $annotation->id]);
        $job = new ProcessAnnotatedVideoStub($annotation->video,
            skipFeatureVectors: true,
            skipPatches: true
        );
        $job->mock = $video;
        $job->output = [[$annotation->id, '"'.json_encode(range(1, 384)).'"']];

        $job->handle();
        $prefix = fragment_uuid_path($annotation->video->uuid);
        $disk->assertMissing("{$prefix}/v-{$annotation->id}.jpg");
        $disk->assertExists("{$prefix}/v-{$annotation->id}.svg");
        $this->assertSame(0, VideoAnnotationLabelFeatureVector::count());
    }

    public function testHandleMultipleAnnotations()
    {
        $disk = Storage::fake('test');
        $video = $this->getFrameMock(2);
        $annotation1 = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        VideoAnnotationLabelTest::create(['annotation_id' => $annotation1->id]);
        $annotation2 = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
            'video_id' => $annotation1->video_id,
        ]);
        VideoAnnotationLabelTest::create(['annotation_id' => $annotation2->id]);

        $job = new ProcessAnnotatedVideoStub($annotation1->video);
        $job->output = [
            [$annotation1->id, '"'.json_encode(range(1, 384)).'"'],
            [$annotation2->id, '"'.json_encode(range(1, 384)).'"'],
        ];
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->twice()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->twice()->andReturn('abc123');
        $job->handle();
        $prefix = fragment_uuid_path($annotation1->video->uuid);
        $disk->assertExists("{$prefix}/v-{$annotation1->id}.jpg");
        $disk->assertExists("{$prefix}/v-{$annotation2->id}.jpg");
        $disk->assertExists("{$prefix}/v-{$annotation1->id}.svg");
        $disk->assertExists("{$prefix}/v-{$annotation2->id}.svg");
        $this->assertSame(2, VideoAnnotationLabelFeatureVector::count());
    }

    public function testHandleOnlyAnnotations()
    {
        $disk = Storage::fake('test');
        $video = $this->getFrameMock(1);
        $annotation1 = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        VideoAnnotationLabelTest::create(['annotation_id' => $annotation1->id]);
        $annotation2 = VideoAnnotationTest::create([
            'points' => [[200, 200]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
            'video_id' => $annotation1->video_id,
        ]);
        VideoAnnotationLabelTest::create(['annotation_id' => $annotation2->id]);

        $job = new ProcessAnnotatedVideoStub($annotation1->video, only: [$annotation1->id]);
        $job->output = [[$annotation1->id, '"'.json_encode(range(1, 384)).'"']];
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');
        $job->handle();
        $prefix = fragment_uuid_path($annotation1->video->uuid);
        $disk->assertExists("{$prefix}/v-{$annotation1->id}.jpg");
        $disk->assertExists("{$prefix}/v-{$annotation1->id}.svg");
        $disk->assertMissing("{$prefix}/v-{$annotation2->id}.jpg");
        $disk->assertMissing("{$prefix}/v-{$annotation2->id}.svg");
        $this->assertSame(1, VideoAnnotationLabelFeatureVector::count());
    }

    public function testHandleInvalidShape()
    {
        config(['thumbnails.height' => 100, 'thumbnails.width' => 100]);
        $disk = Storage::fake('test2');
        $video = $this->getFrameMock();
        $annotation = VideoAnnotationTest::create([
            // This is a real-world example where someone managed to create a zero-sized
            // rectangle.
            'points' => [[844.69,1028.44,844.69,1028.44,844.69,1028.44,844.69,1028.44]],
            'frames' => [0],
            'shape_id' => Shape::rectangleId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video, targetDisk: 'test2');
        $job->mock = $video;

        $video->shouldReceive('crop')
            ->once()
            ->andReturn($video);

        $video->shouldReceive('writeToBuffer')->once()->andReturn('abc123');

        // Assert that no exception is thrown
        $job->handle();
    }

    public function testHandleRuntimeError()
    {
        $disk = Storage::fake('test');
        $video = $this->getFrameMock(0);
        $annotation = VideoAnnotationTest::create([
            'points' => [[100, 100]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;
        $job->throwGetFrame = \FFMpeg\Exception\RuntimeException::class;

        $video->shouldReceive('crop')->never();
        $video->shouldReceive('writeToBuffer')->never();
        $job->handle();
        $this->assertNull($job->input);
    }

    public function testHandleVipsException()
    {
        $disk = Storage::fake('test');
        $video = $this->getFrameMock(0);
        $annotation = VideoAnnotationTest::create([
            'points' => [[100, 100]],
            'frames' => [1],
            'shape_id' => Shape::pointId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video);
        $job->mock = $video;
        $job->throwGetFrame = \Jcupitt\Vips\Exception::class;

        $video->shouldReceive('crop')->never();
        $video->shouldReceive('writeToBuffer')->never();
        $job->handle();
        $this->assertNull($job->input);
    }

    public function testHandleFlatLineStringVector()
    {
        $videoMock = $this->getFrameMock(0);
        $videoMock->shouldReceive('crop')->andReturn($videoMock);
        $videoMock->shouldReceive('writeToBuffer')->andReturn('abc123');

        $annotation = VideoAnnotationTest::create([
            'points' => [[300, 300, 400, 300]],
            'frames' => [1],
            'shape_id' => Shape::lineId(),
        ]);
        $job = new ProcessAnnotatedVideoStub($annotation->video, skipPatches: true, skipSvgs: true);
        $job->mock = $videoMock;
        $job->handleFile($annotation->video, 'abc');

        $input = $job->input;
        $filename = array_keys($input)[0];
        $box = $input[$filename][$annotation->id];
        $this->assertSame([300, 284, 400, 316], $box);
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

class ProcessAnnotatedVideoStub extends ProcessAnnotatedVideo
{
    public $times = [];
    public $input;
    public $outputPath;
    public $output = [];
    public $throwGetFrame = false;

    public function getVideo($path)
    {
        return Mockery::mock(Video::class);
    }

    public function getVideoFrame(Video $video, float $time, int $trySeek = 3)
    {
        if ($this->throwGetFrame !== false) {
            throw new $this->throwGetFrame;
        }

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
