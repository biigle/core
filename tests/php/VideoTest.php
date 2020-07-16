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
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->url);
        $this->assertNotNull($this->model->creator);
        $this->assertNotNull($this->model->project);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->duration);
        $this->assertEquals([], $this->model->attrs);
    }

    public function testCreatorSetNull()
    {
        $this->markTestIncomplete('No longer exists');
        $this->assertNotNull($this->model->creator_id);
        $this->model->creator()->delete();
        $this->assertNull($this->model->fresh()->creator_id);
    }

    public function testGetDiskAttribute()
    {
        $this->model->url = 'test://my/video.mp4';
        $this->assertEquals('test', $this->model->disk);
    }

    public function testGetPathAttribute()
    {
        $this->model->url = 'test://my/video.mp4';
        $this->assertEquals('my/video.mp4', $this->model->path);
    }

    public function testGisLinkAttr()
    {
        $this->markTestIncomplete('No longer exists');
        $this->assertNull($this->model->gis_link);

        $this->model->gis_link = 'http://example.com';
        $this->model->save();
        $this->assertEquals('http://example.com', $this->model->fresh()->gis_link);

        $this->model->gis_link = null;
        $this->model->save();
        $this->assertNull($this->model->fresh()->gis_link);
    }

    public function testSetAndGetDoiAttribute()
    {
        $this->markTestIncomplete('No longer exists');
        $this->model->doi = '10.3389/fmars.2017.00083';
        $this->model->save();
        $this->assertEquals('10.3389/fmars.2017.00083', $this->model->fresh()->doi);

        $this->model->doi = 'https://doi.org/10.3389/fmars.2017.00083';
        $this->model->save();
        $this->assertEquals('10.3389/fmars.2017.00083', $this->model->fresh()->doi);

        $this->model->doi = 'http://doi.org/10.3389/fmars.2017.00083';
        $this->model->save();
        $this->assertEquals('10.3389/fmars.2017.00083', $this->model->fresh()->doi);
    }

    public function testAnnotations()
    {
        $this->assertFalse($this->model->annotations()->exists());
        VideoAnnotationTest::create(['video_id' => $this->model->id]);
        $this->assertTrue($this->model->annotations()->exists());
    }

    public function testIsRemote()
    {
        $this->model->url = 'local://path';
        $this->assertFalse($this->model->isRemote());
        $this->model->url = 'http://remote.path';
        $this->assertTrue($this->model->isRemote());
        $this->model->url = 'https://remote.path';
        $this->assertTrue($this->model->isRemote());
    }

    public function testScopeAccessibleBy()
    {
        $user = UserTest::create();
        $guest = UserTest::create();
        $this->model->project->addUserId($guest->id, Role::guestId());

        $this->assertEquals(0, Video::accessibleBy($user)->count());
        $this->assertEquals(1, Video::accessibleBy($guest)->count());
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
}
