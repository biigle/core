<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\ProcessNewVideo;
use Biigle\Tests\VideoTest;
use Biigle\Video;
use Exception;
use FileCache;
use Storage;
use TestCase;

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
        $this->assertSame(10, intval($video->fresh()->duration));
        $this->assertSame([0.5, 5.0, 9.5], $job->times);

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertTrue($disk->exists("{$fragment}/0.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/1.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/2.jpg"));
    }

    public function testHandleNotFound()
    {
        $video = VideoTest::create(['filename' => 'abc.mp4']);
        $job = new ProcessNewVideoStub($video);

        try {
            $job->handle();
            $this->fail('Expected an exception.');
        } catch (Exception $e) {
            $this->assertSame(Video::ERROR_NOT_FOUND, $video->fresh()->error);
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
            $this->assertSame(Video::ERROR_TOO_LARGE, $video->fresh()->error);
        }
    }

    public function testHandleMimeType()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertSame('video/mp4', $video->fresh()->mimeType);
    }

    public function testHandleInvalidMimeType()
    {
        $video = VideoTest::create(['filename' => 'test-image.jpg']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertSame('image/jpeg', $video->fresh()->mimeType);
        $this->assertSame(Video::ERROR_MIME_TYPE, $video->fresh()->error);
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
            $this->assertSame(Video::ERROR_MIME_TYPE, $video->fresh()->error);
        }
    }

    public function testHandleSize()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertSame(104500, $video->fresh()->size);
    }

    public function testHandleDimensions()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertSame(120, $video->fresh()->width);
        $this->assertSame(144, $video->fresh()->height);
    }

    public function testHandleMalformed()
    {
        $video = VideoTest::create(['filename' => 'test_malformed.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->handle();
        $this->assertSame(Video::ERROR_MALFORMED, $video->fresh()->error);
    }

    public function testHandleInvalidCodec()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->codec = 'h265';
        $job->handle();
        $this->assertSame(Video::ERROR_CODEC, $video->fresh()->error);
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
            $this->assertSame(Video::ERROR_MALFORMED, $video->fresh()->error);
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

    protected function getCodec($path)
    {
        return $this->codec ?: parent::getCodec($path);
    }

    protected function getVideoDuration($path)
    {
        return $this->duration;
    }

    protected function generateVideoThumbnail($path, $time, $width, $height, $format)
    {
        $this->times[] = $time;

        return 'content';
    }
}
