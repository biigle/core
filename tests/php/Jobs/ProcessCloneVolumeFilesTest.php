<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\CloneImageThumbnails;
use Biigle\Jobs\CloneVideoThumbnails;
use Biigle\Jobs\ProcessCloneVolumeFiles;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Queue;
use Storage;
use TestCase;

class ProcessCloneVolumeFilesTest extends TestCase
{
    public function testHandleTiledImageWithThumbnails()
    {
        $format = config('thumbnails.format');
        $diskThumbs = Storage::fake('test-thumbs');
        $diskTiles = Storage::fake('test-tiles');
        config(['thumbnails.storage_disk' => 'test-thumbs']);
        config(['image.tiles.disk' => 'test-tiles']);

        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $prefix = fragment_uuid_path($i1->uuid);

        $copy = VolumeTest::create();
        $i2 = ImageTest::create(['volume_id' => $copy->id, 'filename' => 'a.jpg']);
        $copyPrefix = fragment_uuid_path($i2->uuid);

        $diskThumbs->put($prefix.".{$format}", '');
        $diskTiles->put($prefix.'/ImageProperties.xml', '');

        $map = [$i2->uuid => $i1->uuid];

        Queue::fake();
        
        with(new ProcessCloneVolumeFiles($copy, [], $map))->handle();

        Queue::assertPushed(CloneImageThumbnails::class, fn ($job) => $job->prefix === $prefix && $job->copyPrefix === $copyPrefix);
    }

    public function testHandleImagesWithOnly()
    {
        $format = config('thumbnails.format');
        $diskThumbs = Storage::fake('test-thumbs');
        $diskTiles = Storage::fake('test-tiles');
        config(['thumbnails.storage_disk' => 'test-thumbs']);
        config(['image.tiles.disk' => 'test-tiles']);

        $volume = VolumeTest::create();
        $i1 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $i2 = ImageTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);
        $prefix = fragment_uuid_path($i1->uuid);
        $prefix2 = fragment_uuid_path($i2->uuid);

        $copy = VolumeTest::create();
        $i3 = ImageTest::create(['volume_id' => $copy->id, 'filename' => 'a.jpg']);
        $i4 = ImageTest::create(['volume_id' => $copy->id, 'filename' => 'b.jpg']);

        $diskThumbs->put($prefix.".{$format}", '');
        $diskTiles->put($prefix.'/ImageProperties.xml', '');
        $diskThumbs->put($prefix2.".{$format}", '');
        $diskTiles->put($prefix2.'/ImageProperties.xml', '');

        $map = [$i3->uuid => $i1->uuid, $i4->uuid => $i2->uuid];

        Queue::fake();
        
        with(new ProcessCloneVolumeFiles($copy, [$i3->id], $map))->handle();

        Queue::assertPushed(CloneImageThumbnails::class, fn ($job) => $job->image->id === $i3->id);

        Queue::assertNotPushed(CloneImageThumbnails::class, fn ($job) => $job->image->id === $i4->id);
    }

    public function testHandleVideoWithThumbnails()
    {
        $format = config('thumbnails.format');
        $spriteFormat = config('videos.sprites_format');
        $diskThumbs = Storage::fake('test-v-thumbs');
        $volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $copy = VolumeTest::create(['media_type_id' => MediaType::videoId()]);

        $v1 = VideoTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $v2 = VideoTest::create(['volume_id' => $copy->id, 'filename' => 'a.jpg']);
        $prefix = fragment_uuid_path($v1->uuid);

        $diskThumbs->put($prefix."0.{$format}", '');
        $diskThumbs->put($prefix."/sprite_0.{$spriteFormat}", '');

        $map = [$v2->uuid => $v1->uuid];

        Queue::fake();

        with(new ProcessCloneVolumeFiles($copy, [], $map))->handle();

        Queue::assertPushed(CloneVideoThumbnails::class, fn ($job) => $job->video->id === $v2->id);
    }

    public function testHandleVideosWithOnly()
    {
        $format = config('thumbnails.format');
        $spriteFormat = config('videos.sprites_format');
        $diskThumbs = Storage::fake('test-v-thumbs');
        $volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $copy = VolumeTest::create(['media_type_id' => MediaType::videoId()]);

        $v1 = VideoTest::create(['volume_id' => $volume->id, 'filename' => 'a.jpg']);
        $v2 = VideoTest::create(['volume_id' => $volume->id, 'filename' => 'b.jpg']);
        $v3 = VideoTest::create(['volume_id' => $copy->id, 'filename' => 'a.jpg']);
        $v4 = VideoTest::create(['volume_id' => $copy->id, 'filename' => 'b.jpg']);
        $prefix = fragment_uuid_path($v1->uuid);

        $diskThumbs->put($prefix."0.{$format}", '');
        $diskThumbs->put($prefix."/sprite_0.{$spriteFormat}", '');

        $map = [$v3->uuid => $v1->uuid, $v4->uui1 => $v2->uuid];

        Queue::fake();

        with(new ProcessCloneVolumeFiles($copy, [$v3->id], $map))->handle();

        Queue::assertPushed(CloneVideoThumbnails::class, fn ($job) => $job->video->id === $v3->id);
        Queue::assertNotPushed(CloneVideoThumbnails::class, fn ($job) => $job->video->id === $v4->id);
    }

    public function testHandleVideosQueue()
    {
        config(['videos.process_new_video_queue' => 'low']);
        $volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $copy = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $v1 = VideoTest::create(['volume_id' => $volume->id, 'filename' => 'a.mp4']);
        $v2 = VideoTest::create(['volume_id' => $copy->id, 'filename' => 'a.mp4']);
        $map = [$v2->uuid => $v1->uuid];

        Queue::fake();
        with(new ProcessCloneVolumeFiles($copy, [], $map))->handle();

        Queue::assertPushedOn('low', CloneVideoThumbnails::class, fn ($job) => $job->video->id === $v2->id);
    }
}
