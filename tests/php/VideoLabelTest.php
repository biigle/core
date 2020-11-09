<?php

namespace Biigle\Tests;

use Biigle\VideoLabel;
use Illuminate\Database\QueryException;
use ModelTestCase;

class VideoLabelTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = VideoLabel::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->file);
        $this->assertNotNull($this->model->video);
        $this->assertNotNull($this->model->label);
        $this->assertNotNull($this->model->user);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->file_id);
    }

    public function testVideoOnDeleteCascade()
    {
        $this->assertNotNull($this->model->fresh());
        $this->model->video()->delete();
        $this->assertNull($this->model->fresh());
    }

    public function testLabelOnDeleteRestrict()
    {
        $this->assertNotNull($this->model->fresh());
        $this->expectException(QueryException::class);
        $this->model->label()->delete();
    }

    public function testUserOnDeleteSetNull()
    {
        $this->assertNotNull($this->model->fresh()->user);
        $this->model->user->delete();
        $this->assertNull($this->model->fresh()->user);
    }

    public function testUniqueProperties()
    {
        $this->expectException(QueryException::class);
        self::create([
            'video_id' => $this->model->video_id,
            'label_id' => $this->model->label_id,
        ]);
    }
}
