<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\ProcessNewVideo;
use Biigle\Tests\VideoTest;
use Biigle\Video;
use Exception;
use FileCache;
use Jcupitt\Vips\Extend;
use Storage;
use TestCase;
use VipsImage;

class ProcessNewVideoTest extends TestCase
{
    public function testHandleThumbnails()
    {
        Storage::fake('video-thumbs');
        config(['videos.thumbnail_count' => 3]);
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 10;

        $job->handle();
        $this->assertEquals(10, $video->fresh()->duration);
        $this->assertEquals([0.5, 5, 9.5], array_slice($job->times, 0, 3));

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/0.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/1.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/2.jpg"));
    }

    public function testGenerateSprites()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 180;

        $job->handle();
        $this->assertEquals(180, $video->fresh()->duration);
        $expectedThumbnails = 72;
        $expectedIntervals = range(0, 177.5, 2.5);
        // additional thumbnails caused by generating regular thumbnails
        $additionalThumbnails = $job->thumbnails - $expectedThumbnails;
        $this->assertEquals($expectedThumbnails, $job->thumbnails - $additionalThumbnails);
        $this->assertEquals($expectedIntervals, array_slice($job->times, $additionalThumbnails, $job->thumbnails));

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
        $this->assertTrue($disk->exists("{$fragment}/sprite_1.webp"));
    }

    public function testGenerateSpritesZeroDuration()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 0;

        $job->handle();
        $expectedThumbnails = 0;
        // additional thumbnails caused by generating regular thumbnails
        $additionalThumbnails = $job->thumbnails - $expectedThumbnails;
        $this->assertEquals($expectedThumbnails, $job->thumbnails - $additionalThumbnails);
        $this->assertEquals([], array_slice($job->times, $additionalThumbnails, $job->thumbnails));

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertFalse($disk->exists("{$fragment}/sprite_0.webp"));
    }

    public function testGenerateSpritesOneSecondDuration()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 1;

        $job->handle();
        $this->assertEquals(1, $video->fresh()->duration);
        $expectedThumbnails = 5;
        // additional thumbnails caused by generating regular thumbnails
        $additionalThumbnails = $job->thumbnails - $expectedThumbnails;
        $this->assertEquals($expectedThumbnails, $job->thumbnails - $additionalThumbnails);
        $this->assertEquals([0.0, 0.2, 0.4, 0.6, 0.8], array_slice($job->times, $additionalThumbnails, $job->thumbnails));

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));

    }

    public function testGenerateSpritesExceedsMaxThumbnails()
    {
        Storage::fake('video-thumbs');
        config(['videos.sprites_max_thumbnails' => 50]);
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 130;

        $job->handle();
        $this->assertEquals(130, $video->fresh()->duration);
        $expectedThumbnails = 50;
        $expectedIntervals = array_map(fn ($value) => round($value, 2), range(0, 127.4, 2.6));
        // additional frames caused by generating regular thumbnails
        $additionalThumbnails = $job->thumbnails - $expectedThumbnails;
        $this->assertEquals($expectedThumbnails, $job->thumbnails - $additionalThumbnails);
        $this->assertEquals($expectedIntervals, array_slice($job->times, $additionalThumbnails, $job->thumbnails));

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
        $this->assertTrue($disk->exists("{$fragment}/sprite_1.webp"));
    }

    public function testGenerateSpritesFallsBelowMinThumbnails()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 5;

        $job->handle();
        $this->assertEquals(5, $video->fresh()->duration);
        $expectedThumbnails = 5;
        // additional frames caused by generating regular thumbnails
        $additionalThumbnails = $job->thumbnails - $expectedThumbnails;
        $this->assertEquals($expectedThumbnails, $job->thumbnails - $additionalThumbnails);
        $this->assertEquals([0.0, 1.0, 2.0, 3.0, 4.0], array_slice($job->times, $additionalThumbnails, $job->thumbnails));

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
    }

    public function testHandleNotFound()
    {
        $video = VideoTest::create(['filename' => 'abc.mp4']);
        $job = new ProcessNewVideoStub($video);

        try {
            $job->handle();
            $this->fail('Expected an exception.');
        } catch (Exception $e) {
            $this->assertEquals(Video::ERROR_NOT_FOUND, $video->fresh()->error);
        }
    }

    public function testHandleTooLarge()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        FileCache::shouldReceive('getOnce')
            ->andThrow(new Exception('The file is too large with more than 0 bytes.'));

        try {
            $job->handle();
            $this->fail('Expected an exception.');
        } catch (Exception $e) {
            $this->assertEquals(Video::ERROR_TOO_LARGE, $video->fresh()->error);
        }
    }

    public function testHandleMimeType()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertEquals('video/mp4', $video->fresh()->mimeType);
    }

    public function testHandleInvalidMimeType()
    {
        $video = VideoTest::create(['filename' => 'test-image.jpg']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertEquals('image/jpeg', $video->fresh()->mimeType);
        $this->assertEquals(Video::ERROR_MIME_TYPE, $video->fresh()->error);
    }

    public function testHandleInvalidMimeTypeFileCache()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        FileCache::shouldReceive('getOnce')
            ->andThrow(new Exception("Error while caching file 'test.mp4': MIME type 'video/x-m4v' not allowed."));

        try {
            $job->handle();
            $this->fail('Expected an exception.');
        } catch (Exception $e) {
            $this->assertEquals(Video::ERROR_MIME_TYPE, $video->fresh()->error);
        }
    }

    public function testHandleSize()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertEquals(104500, $video->fresh()->size);
    }

    public function testHandleDimensions()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertEquals(120, $video->fresh()->width);
        $this->assertEquals(144, $video->fresh()->height);
    }

    public function testHandleMalformed()
    {
        $video = VideoTest::create(['filename' => 'test_malformed.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertEquals(Video::ERROR_MALFORMED, $video->fresh()->error);
    }

    public function testHandleInvalidCodec()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->codec = 'h265';
        $job->handle();
        $this->assertEquals(Video::ERROR_CODEC, $video->fresh()->error);
    }

    public function testHandleKeepErrorOnError()
    {
        $video = VideoTest::create([
            'filename' => 'abc.mp4',
            'attrs' => ['error' => Video::ERROR_MALFORMED],
        ]);
        $job = new ProcessNewVideoStub($video);
        try {
            $job->handle();
            $this->fail('Expected an exception.');
        } catch (Exception $e) {
            $this->assertEquals(Video::ERROR_MALFORMED, $video->fresh()->error);
        }
    }

    public function testHandleRemoveErrorOnSuccess()
    {
        $video = VideoTest::create([
            'filename' => 'test.mp4',
            'attrs' => ['error' => Video::ERROR_NOT_FOUND],
        ]);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertNull($video->fresh()->error);
    }
}

class ProcessNewVideoStub extends ProcessNewVideo
{
    public $duration = 0;
    public $codec = '';
    public $times = [];
    public $thumbnails = 0;

    protected function getCodec($path)
    {
        return $this->codec ?: parent::getCodec($path);
    }

    protected function getVideoDuration($path)
    {
        return $this->duration;
    }

    protected function generateVideoThumbnail($path, $time, $width, $height)
    {
        $this->times[] = $time;
        $this->thumbnails += 1;

        return VipsImage::black(240, 138)
            ->embed(30, 40, 240, 138, ['extend' => Extend::WHITE]) // Extend left & top edges with white color
            ->add("#FFFFFF")
            ->cast("uchar");
    }
}
