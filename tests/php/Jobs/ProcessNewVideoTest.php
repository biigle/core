<?php

namespace Biigle\Tests\Jobs;

use Biigle\Events\VolumeFilesProcessed;
use Biigle\Jobs\ProcessNewVideo;
use Biigle\Tests\VideoTest;
use Biigle\User;
use Biigle\Video;
use Biigle\Volume;
use Exception;
use FileCache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\File;
use Jcupitt\Vips\Image as VipsImage;
use Storage;
use TestCase;

class ProcessNewVideoTest extends TestCase
{
    protected $volume;
    protected $user;

    public function setUp(): void
    {
        parent::setUp();
        Event::fake();
        $this->user = User::factory()->create();
        $this->volume = Volume::factory()->create(['creator_id' => $this->user]);
    }

    public function testHandleThumbnails()
    {
        Storage::fake('video-thumbs');
        config(['videos.thumbnail_count' => 3]);
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $tmp = config('videos.tmp_dir');
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);

        $job->duration = 10.0;
        $job->handle();
        $this->assertSame(10.0, $video->fresh()->duration);

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(4, $disk->files($fragment));
        $this->assertTrue($disk->exists("{$fragment}/0.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/1.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/2.jpg"));
        $this->assertFalse($disk->exists("{$fragment}/3.jpg"));
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
        $this->assertFalse(File::exists("{$tmp}/{$fragment}"));
        Event::assertDispatchedOnce(VolumeFilesProcessed::class);
    }

    public function testGenerateSprites()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $tmp = config('videos.tmp_dir');
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->duration = 180;
        $job->handle();

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(13, $disk->files($fragment));
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
        $this->assertTrue($disk->exists("{$fragment}/sprite_1.webp"));
        $this->assertTrue($disk->exists("{$fragment}/sprite_2.webp"));
        $this->assertFalse(File::exists("{$tmp}/{$fragment}"));
    }

    public function testGenerateSpritesZeroDuration()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $tmp = config('videos.tmp_dir');
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->duration = 0;
        $job->handle();

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(0, $disk->files($fragment));
        $this->assertFalse($disk->exists("{$fragment}/sprite_0.webp"));
        $this->assertFalse(File::exists("{$tmp}/{$fragment}"));
    }

    public function testGenerateSpritesExceedsMaxThumbnails()
    {
        Storage::fake('video-thumbs');
        config(['videos.sprites_max_thumbnails' => 5]);
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $tmp = config('videos.tmp_dir');
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->duration = 25;
        $job->handle();

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(6, $disk->files($fragment));
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
        $this->assertFalse(File::exists("{$tmp}/{$fragment}"));
    }

    public function testGenerateSpritesFallsBelowMinThumbnails()
    {
        Storage::fake('video-thumbs');
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $tmp = config('videos.tmp_dir');
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->duration = 10;
        $job->handle();

        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $this->assertCount(11, $disk->files($fragment));
        $this->assertTrue($disk->exists("{$fragment}/sprite_0.webp"));
        $this->assertFalse(File::exists("{$tmp}/{$fragment}"));
    }

    public function testHandleNotFound()
    {
        $video = VideoTest::create(['filename' => 'abc.mp4']);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);

        try {
            $job->handle();
            $this->fail('Expected an exception.');
        } catch (Exception $e) {
            $this->assertSame(Video::ERROR_NOT_FOUND, $video->fresh()->error);
        }
        Event::assertNotDispatched(VolumeFilesProcessed::class);
    }

    public function testHandleTooLarge()
    {
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        FileCache::shouldReceive('getOnce')
            ->andThrow(new Exception('The file is too large with more than 0 bytes.'));

        try {
            $job->handle();
            $this->fail('Expected an exception.');
        } catch (Exception $e) {
            $this->assertSame(Video::ERROR_TOO_LARGE, $video->fresh()->error);
        }
        Event::assertNotDispatched(VolumeFilesProcessed::class);

    }

    public function testHandleMimeType()
    {
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->handle();
        $this->assertSame('video/mp4', $video->fresh()->mimeType);
        Event::assertDispatched(VolumeFilesProcessed::class);
    }

    public function testHandleInvalidMimeType()
    {
        $video = VideoTest::create(['filename' => 'test-image.jpg']);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->handle();
        $this->assertSame('image/jpeg', $video->fresh()->mimeType);
        $this->assertSame(Video::ERROR_MIME_TYPE, $video->fresh()->error);
        Event::assertDispatched(VolumeFilesProcessed::class);
    }

    public function testHandleInvalidMimeTypeFileCache()
    {
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        FileCache::shouldReceive('getOnce')
            ->andThrow(new Exception("Error while caching file 'test.mp4': MIME type 'video/x-m4v' not allowed."));

        try {
            $job->handle();
            $this->fail('Expected an exception.');
        } catch (Exception $e) {
            $this->assertSame(Video::ERROR_MIME_TYPE, $video->fresh()->error);
        }
        Event::assertNotDispatched(VolumeFilesProcessed::class);
    }

    public function testHandleSize()
    {
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->handle();
        $this->assertSame(104500, $video->fresh()->size);
    }

    public function testHandleDimensions()
    {
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->passThroughDimensions = true;
        $job->handle();
        $this->assertSame(120, $video->fresh()->width);
        $this->assertSame(144, $video->fresh()->height);
    }

    public function testHandleMalformed()
    {
        $video = VideoTest::create(['filename' => 'test_malformed.mp4']);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->passThroughCodec = true;
        $job->handle();
        $this->assertSame(Video::ERROR_MALFORMED, $video->fresh()->error);
        Event::assertDispatched(VolumeFilesProcessed::class);
    }

    public function testHandleInvalidCodec()
    {
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->codec = 'h265';
        $job->handle();
        $this->assertSame(Video::ERROR_CODEC, $video->fresh()->error);
        Event::assertDispatched(VolumeFilesProcessed::class);
    }

    public function testHandleKeepErrorOnError()
    {
        $video = VideoTest::create([
            'filename' => 'abc.mp4',
            'attrs' => ['error' => Video::ERROR_MALFORMED],
        ]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        try {
            $job->handle();
            $this->fail('Expected an exception.');
        } catch (Exception $e) {
            $this->assertSame(Video::ERROR_MALFORMED, $video->fresh()->error);
        }
        Event::assertNotDispatched(VolumeFilesProcessed::class);
    }

    public function testHandleRemoveErrorOnSuccess()
    {
        $video = VideoTest::create([
            'filename' => 'test.mp4',
            'attrs' => ['error' => Video::ERROR_NOT_FOUND],
        ]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->handle();
        $this->assertNull($video->fresh()->error);
        Event::assertDispatched(VolumeFilesProcessed::class);
    }

    public function testHasInvalidMoovAtomPosition()
    {
        $video = VideoTest::create(['filename' => 'test_invalid_moov_atom.mp4', 'volume_id' => $this->volume]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $job->passThroughMimeType = true;
        $job->handle();
        $this->assertSame(Video::ERROR_INVALID_MOOV_POS, $video->fresh()->error);
        Event::assertDispatched(VolumeFilesProcessed::class);
    }

    public function testHasInvalidMoovAtomPositionNoAtom()
    {
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $this->volume]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $video->mimeType = 'video/webm';
        $job->passThroughMimeType = true;
        $job->handle();
        $this->assertEmpty($video->fresh()->error);

        $vol = Volume::factory()->create(['creator_id' => $this->user]);
        $video = VideoTest::create(['filename' => 'test.mp4', 'volume_id' => $vol]);
        $job = new ProcessNewVideoStub(collect([$video]), $this->user);
        $video->mimeType = 'video/mpeg';
        $job->passThroughMimeType = true;
        $job->handle();
        $this->assertEmpty($video->fresh()->error);
        Event::assertDispatched(VolumeFilesProcessed::class);
    }
}

class ProcessNewVideoStub extends ProcessNewVideo
{
    public $codec = 'h264';
    public $thumbnails = 0;
    public $duration = 0;
    public $passThroughDimensions = false;
    public $passThroughCodec = false;
    public $passThroughMimeType = false;

    protected function getVideoDimensions($url)
    {
        if ($this->passThroughDimensions) {
            return parent::getVideoDimensions($url);
        }

        return new Dimension(100, 100);
    }

    protected function getCodec($path)
    {
        if ($this->passThroughCodec) {
            return parent::getCodec($path);
        }

        return $this->codec;
    }

    protected function getVideoDuration($path)
    {
        return $this->duration;
    }

    protected function generateSnapshots(string $sourcePath, float $frameRate, string $targetDir, int $maxFrames = -1): void
    {
        $format = config('thumbnails.format');
        $numberSnapshots = intval($this->duration * $frameRate);
        for ($i=0; $i < $numberSnapshots; $i++) {
            $n = sprintf('%4d', $i);
            File::put("{$targetDir}/{$n}.{$format}", 'content');
        }
    }

    protected function generateThumbnail(string $file, int $width, int $height): VipsImage
    {
        return VipsImage::black(100, 100);
    }

    protected function hasInvalidMoovAtomPosition($source, $video)
    {
        if ($this->passThroughMimeType) {
            return parent::hasInvalidMoovAtomPosition($source, $video);
        }
        return false;
    }
}
