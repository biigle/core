<?php

namespace Biigle\Tests;

use Biigle\Events\VideosDeleted;
use Biigle\Video;
use Carbon\Carbon;
use Event;
use ModelTestCase;

class VideoTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Video::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->uuid);
        $this->assertNotNull($this->model->filename);
        $this->assertNotNull($this->model->url);
        $this->assertNotNull($this->model->volume);
        $this->assertNotNull($this->model->duration);
        $this->assertSame([], $this->model->attrs);
    }

    public function testAnnotations()
    {
        $this->assertFalse($this->model->annotations()->exists());
        VideoAnnotationTest::create(['video_id' => $this->model->id]);
        $this->assertTrue($this->model->annotations()->exists());
    }

    public function testGetThumbnailAttribute()
    {
        config(['videos.thumbnail_count' => 3]);
        $this->assertStringContainsString("{$this->model->uuid}/1", $this->model->thumbnail);
    }

    public function testGetThumbnailUrlAttribute()
    {
        config(['videos.thumbnail_count' => 3]);
        $this->assertStringContainsString("{$this->model->uuid}/1", $this->model->thumbnailUrl);
    }

    public function testGetThumbnailsAttribute()
    {
        config(['videos.thumbnail_count' => 3]);
        $this->assertContains("{$this->model->uuid}/0", $this->model->thumbnails);
        $this->assertContains("{$this->model->uuid}/1", $this->model->thumbnails);
        $this->assertContains("{$this->model->uuid}/2", $this->model->thumbnails);
    }

    public function testGetThumbnailsUrlAttribute()
    {
        config(['videos.thumbnail_count' => 3]);
        $this->assertStringContainsString("{$this->model->uuid}/0", $this->model->thumbnailsUrl[0]);
        $this->assertStringContainsString("{$this->model->uuid}/1", $this->model->thumbnailsUrl[1]);
        $this->assertStringContainsString("{$this->model->uuid}/2", $this->model->thumbnailsUrl[2]);
    }

    public function testGetErrorAttribute()
    {
        $this->assertNull($this->model->error);
        $this->model->attrs = ['error' => 'not-found'];
        $this->assertSame('not-found', $this->model->error);
    }

    public function testSetErrorAttribute()
    {
        $this->model->error = 'not-found';
        $this->assertSame(['error' => 'not-found'], $this->model->attrs);
    }

    public function testGetMimeTypeAttribute()
    {
        $this->assertNull($this->model->mimeType);
        $this->model->attrs = ['mimetype' => 'video/mp4'];
        $this->assertSame('video/mp4', $this->model->mimeType);
    }

    public function testSetMimeTypeAttribute()
    {
        $this->model->mimeType = 'video/mp4';
        $this->assertSame(['mimetype' => 'video/mp4'], $this->model->attrs);
    }

    public function testGetSizeAttribute()
    {
        $this->assertNull($this->model->size);
        $this->model->attrs = ['size' => 123];
        $this->assertSame(123, $this->model->size);
    }

    public function testSetSizeAttribute()
    {
        $this->model->size = 123;
        $this->assertSame(['size' => 123], $this->model->attrs);
    }

    public function testSetWidthAttribute()
    {
        $this->model->width = 123;
        $this->assertSame(['width' => 123], $this->model->attrs);
    }

    public function testSetHeightAttribute()
    {
        $this->model->height = 123;
        $this->assertSame(['height' => 123], $this->model->attrs);
    }

    public function testHasBeenProcessed()
    {
        $this->assertFalse($this->model->hasBeenProcessed());
        $this->model->size = 123;
        $this->assertTrue($this->model->hasBeenProcessed());
    }

    public function testLabels()
    {
        $vl = VideoLabelTest::create(['video_id' => $this->model->id]);
        $this->assertSame(1, $this->model->labels()->count());
        $label = $this->model->labels()->first();
        $this->assertSame($vl->id, $label->id);
    }

    public function testImagesDeletedEventOnDelete()
    {
        Event::fake([VideosDeleted::class]);
        $this->model->delete();
        Event::assertDispatched(VideosDeleted::class, fn ($event) => $event->uuids[0] === $this->model->uuid);
    }

    public function testTakenAt()
    {
        $this->assertNull($this->model->taken_at);
        $now = Carbon::now();
        $then = $now->addMinute();
        $this->model->taken_at = [$now, $then];
        $this->model->save();
        $takenAt = $this->model->fresh()->taken_at;
        $this->assertSame($now->timestamp, $takenAt[0]->timestamp);
        $this->assertSame($then->timestamp, $takenAt[1]->timestamp);
    }

    public function testSetGetLngAttribute()
    {
        $expect = [52.220, 52.230];
        $this->assertNull($this->model->lng);
        $this->model->lng = $expect;
        $this->model->save();
        $this->assertSame($expect, $this->model->fresh()->lng);
    }

    public function testSetGetLatAttribute()
    {
        $expect = [28.123, 28.133];
        $this->assertNull($this->model->lat);
        $this->model->lat = $expect;
        $this->model->save();
        $this->assertSame($expect, $this->model->fresh()->lat);
    }

    public function testSetGetMetadataAttribute()
    {
        $expect = ['area' => [2.6, 1.6]];
        $this->assertSame([], $this->model->metadata);
        $this->model->metadata = $expect;
        $this->model->save();
        $this->assertSame($expect, $this->model->fresh()->metadata);
    }
}
