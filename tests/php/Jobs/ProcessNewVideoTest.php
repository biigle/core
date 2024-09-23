<?php

namespace Biigle\Tests\Jobs;

use Storage;
use TestCase;
use Exception;
use FileCache;
use Biigle\Video;
use Jcupitt\Vips\Extend;
use Biigle\Tests\VideoTest;
use Biigle\Jobs\ProcessNewVideo;
use Jcupitt\Vips\Image as VipsImage;

class ProcessNewVideoTest extends TestCase
{
    public function testHandleThumbnails()
    {
        config(['videos.thumbnail_count' => 3]);
        $thumbCount = config('videos.thumbnail_count');
        $video = Video::factory()->create(['duration' => 10.0]);
        $job = new ProcessNewVideoStub($video);
        $job->handle();

        $this->assertCount(4, $job->ffmpegImages);
        $this->assertCount($thumbCount, $job->thumbnails);
        $this->assertCount(1, $job->sprites);
    }

    public function testGenerateSprites()
    {
        $video = Video::factory()->create(['duration' => 180.0]);
        $thumbCount = config('videos.thumbnail_count');
        $job = new ProcessNewVideoStub($video);
        $job->handle();

        $this->assertCount(72, $job->ffmpegImages);
        $this->assertCount($thumbCount, haystack: $job->thumbnails);
        $this->assertCount(3, haystack: $job->sprites);
    }

    public function testGenerateSpritesOneSecondDuration()
    {
        $video = Video::factory()->create(['duration' => 1.0]);
        $job = new ProcessNewVideoStub($video);
        $job->handle();

        $this->assertCount(1, $job->ffmpegImages);
        $this->assertCount(1, haystack: $job->thumbnails);
        $this->assertCount(1, haystack: $job->sprites);

    }

    public function testGenerateSpritesExceedsMaxThumbnails()
    {
        $maxThumbs = 5;
        config(['videos.sprites_max_thumbnails' => $maxThumbs]);
        $thumbIntv = config('videos.sprites_thumbnail_interval');
        $video = Video::factory()->create(['duration' => 15.0]);
        $job = new ProcessNewVideoStub($video);
        $job->handle();

        $this->assertGreaterThan( $maxThumbs, $video->duration/$thumbIntv);
        $this->assertCount($maxThumbs, $job->ffmpegImages);
        $this->assertCount($maxThumbs, haystack: $job->thumbnails);
        $this->assertCount(1, haystack: $job->sprites);
    }

    public function testTmpDirectoryDeletion()
    {
        $tmp = config('videos.tmp_dir');
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $fragment = fragment_uuid_path($video->uuid);
        $job = new ProcessNewVideoStub($video);
        $job->testDirRemoval = true;
        $job->handle();

        $this->assertDirectoryDoesNotExist("{$tmp}/{$fragment}");
    }

    public function testHandleNotFound()
    {
        $video = VideoTest::create(['filename' => 'abc.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->testHandler = true;

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
        $job->testHandler = true;
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
        $job->testHandler = true;
        $job->handle();
        $this->assertSame('video/mp4', $video->fresh()->mimeType);
    }

    public function testHandleInvalidMimeType()
    {
        $video = VideoTest::create(['filename' => 'test-image.jpg']);
        $job = new ProcessNewVideoStub($video);
        $job->testHandler = true;
        $job->handle();
        $this->assertSame('image/jpeg', $video->fresh()->mimeType);
        $this->assertSame(Video::ERROR_MIME_TYPE, $video->fresh()->error);
    }

    public function testHandleInvalidMimeTypeFileCache()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->testHandler = true;
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
        $job->testHandler = true;
        $job->handle();
        $this->assertSame(104500, $video->fresh()->size);
    }

    public function testHandleDimensions()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->testHandler = true;
        $job->handle();
        $this->assertSame(120, $video->fresh()->width);
        $this->assertSame(144, $video->fresh()->height);
    }

    public function testHandleMalformed()
    {
        $video = VideoTest::create(['filename' => 'test_malformed.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->testHandler = true;
        $job->handle();
        $this->assertSame(Video::ERROR_MALFORMED, $video->fresh()->error);
    }

    public function testHandleInvalidCodec()
    {
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->codec = 'h265';
        $job->testHandler = true;
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
        $job->testHandler = true;
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
        $job->testHandler = true;
        $job->handle();
        $this->assertNull($video->fresh()->error);
    }
}

class ProcessNewVideoStub extends ProcessNewVideo
{
    public $codec = '';
    public $ffmpegImages = [];

    public $thumbnails = [];

    public $sprites = [];

    public $testHandler = false;

    public $testDirRemoval = false;

    protected function getCodec($path)
    {
        return $this->codec ?: parent::getCodec($path);
    }

    public function handle()
    {
        if ($this->testHandler || $this->testDirRemoval) {
            parent::handle();
            return;
        }
        $this->handleFile($this->video, "test");
    }

    public function handleFile($file, $path)
    {
        if ($this->testHandler || $this->testDirRemoval) {
            parent::handleFile($file, $path);
            return;
        }
        $disk = Storage::disk(config('videos.thumbnail_storage_disk'));
        $fragment = fragment_uuid_path($this->video->uuid);

        $tmp = config('videos.tmp_dir');
        $tmpDir = "{$tmp}/{$fragment}";

        $this->createThumbnails($path, $disk, $fragment, $tmpDir);

    }

    protected function createThumbnails($path, $disk, $fragment, $tmpDir)
    {
        if ($this->testDirRemoval) {
            return;
        }
        parent::createThumbnails($path, $disk, $fragment, $tmpDir);
    }

    protected function getFiles($tmpDir)
    {
        return array_fill(0, count($this->ffmpegImages), 'file');
    }

    protected function runFFMPEG($path, $frameRate, $destinationPath, $format)
    {
        $format = config('thumbnails.format');
        $info = $this->getThumbnailInfos($this->video->duration);
        $estimatedThumbnails = $info['estimatedThumbnails'];
        // $estimatedThumbnails < 1 would make FFMPEG generate exactly one image
        if ($estimatedThumbnails < 1) {
            $estimatedThumbnails = 1;
        }
        if ($estimatedThumbnails > config('videos.sprites_max_thumbnails')) {
            $estimatedThumbnails = $this->video->duration * $info['frameRate'];
        }
        $this->ffmpegImages = array_fill(0, $estimatedThumbnails, $this->createBlackImage());
    }

    protected function save($disk, $img, $isThumb, $fragment, $counter, $q)
    {
        if ($isThumb) {
            $this->thumbnails[] = $img;
        } else {
            $this->sprites[] = $img;
        }
    }

    protected function createSingleSprite($thumbnails, $thumbnailsPerRow)
    {
        return $this->createBlackImage();
    }

    protected function createSingleThumbnail($file, $width, $height)
    {
        return $this->createBlackImage();
    }

    protected function createBlackImage()
    {
        return VipsImage::black(240, 138)
            ->embed(30, 40, 240, 138, ['extend' => Extend::WHITE]) // Extend left & top edges with white color
            ->add("#FFFFFF")
            ->cast("uchar");
    }


}
