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

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(5, $disk->files($fragment));
        $this->assertTrue($disk->exists("{$fragment}/0.jpg"));      
        $this->assertTrue($disk->exists("{$fragment}/1.jpg"));      
        $this->assertTrue($disk->exists("{$fragment}/2.jpg"));      
        $this->assertTrue($disk->exists("{$fragment}/3.jpg"));      
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));      
    }

    public function testGenerateSprites()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 180;
        $job->handle();

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(75, $disk->files($fragment));
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
        $this->assertTrue($disk->exists("{$fragment}/sprite_1.webp"));
        $this->assertTrue($disk->exists("{$fragment}/sprite_2.webp"));
    }

    public function testGenerateSpritesZeroDuration()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 0;
        $job->handle();

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(0, $disk->files($fragment));
        $this->assertFalse($disk->exists("{$fragment}/sprite_0.webp"));
    }

    public function testGenerateSpritesOneSecondDuration()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->duration = 1;

        $job->handle();

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(2, $disk->files($fragment));
        $this->assertTrue($disk->exists("{$fragment}/0.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));

    }

    public function testGenerateSpritesExceedsMaxThumbnails()
    {
        Storage::fake('video-thumbs');
        config(['videos.sprites_max_thumbnails' => 5]);
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->useFfmpeg = true;
        $job->handle();

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(6, $disk->files($fragment));
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
    }

    public function testGenerateSpritesFallsBelowMinThumbnails()
    {
        Storage::fake('video-thumbs');
        config(['videos.sprites_min_thumbnails' => 10]);
        $video = VideoTest::create(['filename' => 'test.mp4']);
        $job = new ProcessNewVideoStub($video);
        $job->useFfmpeg = true;

        $job->handle();

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(11, $disk->files($fragment));
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
    public $codec = '';
    public $thumbnails = 0;
    public $duration = 0;
    public $useFfmpeg = false;

    protected function getCodec($path)
    {
        return $this->codec ?: parent::getCodec($path);
    }

    protected function generateImagesfromVideo($path, $duration, $destinationPath)
    {
        // Use parent method to test max and min number of thumbnail generation
        if($this->useFfmpeg){
            parent::generateImagesfromVideo($path, $duration, $destinationPath);
            return;
        }

        $defaultThumbnailInterval = config('videos.sprites_thumbnail_interval');
        $durationRounded = floor($this->duration * 10) / 10;
        $estimatedThumbnails = $durationRounded / $defaultThumbnailInterval;

        for($i=0;$i<$estimatedThumbnails; $i++){
            $img = VipsImage::black(240, 138)
            ->embed(30, 40, 240, 138, ['extend' => Extend::WHITE]) // Extend left & top edges with white color
            ->add("#FFFFFF")
            ->cast("uchar");
            $img->writeToFile($destinationPath."/{$i}.jpg");

        }
    }
}
