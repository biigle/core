<?php

namespace Biigle\Tests\Modules\Videos;

use ModelTestCase;
use Biigle\Modules\Videos\Video;

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
        $this->assertNotNull($this->model->project);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertEquals([], $this->model->meta);
    }

    public function testGetDisk()
    {
        $this->model->url = 'test://my/video.mp4';
        $this->assertEquals('test', $this->model->getDisk());
    }

    public function testGetPath()
    {
        $this->model->url = 'test://my/video.mp4';
        $this->assertEquals('my/video.mp4', $this->model->getPath());
    }
}
