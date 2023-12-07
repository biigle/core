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
        config(['videos.frames_per_sprite' => 9]);
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 180;

        $job->handle();
        $this->assertEquals(180, $video->fresh()->duration);
        $expected_frames = 18;
        // additional frames caused by generating regular thumbnails
        $additional_frames = $job->frames - $expected_frames;
        $this->assertEquals($expected_frames, $job->frames - $additional_frames);
        $this->assertEquals([0.0, 10.0, 20.0, 30.0, 40.0, 50.0,
            60.0, 70.0, 80.0, 90.0, 100.0, 110.0, 120.0, 130.0,
            140.0, 150.0, 160.0, 170.0], array_slice($job->times, $additional_frames, $job->frames));

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
        $expected_frames = 0;
        // additional frames caused by generating regular thumbnails
        $additional_frames = $job->frames - $expected_frames;
        $this->assertEquals($expected_frames, $job->frames - $additional_frames);
        $this->assertEquals([], array_slice($job->times, $additional_frames, $job->frames));

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
        $expected_frames = 5;
        // additional frames caused by generating regular thumbnails
        $additional_frames = $job->frames - $expected_frames;
        $this->assertEquals($expected_frames, $job->frames - $additional_frames);
        $this->assertEquals([0.0, 0.2, 0.4, 0.6, 0.8], array_slice($job->times, $additional_frames, $job->frames));

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));

    }

    public function testGenerateSpritesExceedsMaxFrames()
    {
        Storage::fake('video-thumbs');
        config(['videos.sprites_max_frames' => 25]);
        config(['videos.sprites_interval_seconds' => 5]);
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 130;

        $job->handle();
        $this->assertEquals(130, $video->fresh()->duration);
        $expected_frames = 25;
        // additional frames caused by generating regular thumbnails
        $additional_frames = $job->frames - $expected_frames;
        $this->assertEquals($expected_frames, $job->frames - $additional_frames);
        $this->assertEquals([0.0, 5.2, 10.4, 15.6, 20.8, 26.0, 31.2, 36.4,
            41.6, 46.8, 52.0, 57.2, 62.4, 67.6, 72.8, 78.0, 83.2, 88.4,
            93.6, 98.8, 104.0, 109.2, 114.4, 119.6, 124.8], array_slice($job->times, $additional_frames, $job->frames));

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
    }

    public function testGenerateSpritesFallsBelowMinFrames()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 20;

        $job->handle();
        $this->assertEquals(20, $video->fresh()->duration);
        $expected_frames = 5;
        // additional frames caused by generating regular thumbnails
        $additional_frames = $job->frames - $expected_frames;
        $this->assertEquals($expected_frames, $job->frames - $additional_frames);
        $this->assertEquals([0.0, 4.0, 8.0, 12.0, 16.0], array_slice($job->times, $additional_frames, $job->frames));


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
    public $frames = 0;

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
        $this->frames += 1;

        return VipsImage::black(240, 138)
            ->embed(30, 40, 240, 138, ['extend' => Extend::WHITE]) // Extend left & top edges with white color
            ->add("#FFFFFF")
            ->cast("uchar");
    }
}
