<?php

namespace Biigle\Tests;

use ModelTestCase;
use Biigle\ImageLabel;
use Biigle\ProjectVolume;

class ImageLabelTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = ImageLabel::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->image);
        $this->assertNotNull($this->model->label);
        $this->assertNotNull($this->model->user);
        $this->assertNotNull($this->model->project_volume_id);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testProjectVolumeOnDeleteCascade()
    {
        $this->assertNotNull($this->model->fresh());
        ProjectVolume::where('id', $this->model->project_volume_id)->delete();
        $this->assertNull($this->model->fresh());
    }

    public function testImageOnDeleteRestrict()
    {
        $this->assertNotNull($this->model->fresh());
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->image()->delete();
    }

    public function testLabelOnDeleteRestrict()
    {
        $this->assertNotNull($this->model->fresh());
        $this->setExpectedException('Illuminate\Database\QueryException');
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
        $this->setExpectedException('Illuminate\Database\QueryException');
        self::create([
            'image_id' => $this->model->image_id,
            'label_id' => $this->model->label_id,
            'project_volume_id' => $this->model->project_volume_id,
        ]);
    }
}
