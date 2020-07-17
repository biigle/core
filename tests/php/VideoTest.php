<?php

namespace Biigle\Tests;

use Biigle\Events\VideoDeleted;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Video;
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
        $this->assertEquals([], $this->model->attrs);
    }

    public function testAnnotations()
    {
        $this->assertFalse($this->model->annotations()->exists());
        VideoAnnotationTest::create(['video_id' => $this->model->id]);
        $this->assertTrue($this->model->annotations()->exists());
    }

    public function testDispatchesDeletedEvent()
    {
        Event::fake();
        $this->model->delete();
        Event::assertDispatched(VideoDeleted::class);
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
        $this->assertEquals('not-found', $this->model->error);
    }

    public function testSetErrorAttribute()
    {
        $this->model->error = 'not-found';
        $this->assertEquals(['error' => 'not-found'], $this->model->attrs);
    }

    public function testGetMimeTypeAttribute()
    {
        $this->assertNull($this->model->mimeType);
        $this->model->attrs = ['mimetype' => 'video/mp4'];
        $this->assertEquals('video/mp4', $this->model->mimeType);
    }

    public function testSetMimeTypeAttribute()
    {
        $this->model->mimeType = 'video/mp4';
        $this->assertEquals(['mimetype' => 'video/mp4'], $this->model->attrs);
    }

        public function testGetSizeAttribute()
    {
        $this->assertNull($this->model->size);
        $this->model->attrs = ['size' => 123];
        $this->assertEquals(123, $this->model->size);
    }

    public function testSetSizeAttribute()
    {
        $this->model->size = 123;
        $this->assertEquals(['size' => 123], $this->model->attrs);
    }
}
