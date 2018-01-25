<?php

namespace Biigle\Tests;

use DB;
use ModelTestCase;
use Biigle\ProjectVolume;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;

class ProjectVolumeTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = ProjectVolume::class;

    public function testAttributes()
    {
        $project = ProjectTest::create();
        $project->volumes()->attach(VolumeTest::create());
        $pivot = $project->volumes()->first()->pivot;
        $this->assertNotNull($pivot->id);
        $this->assertNotNull($pivot->project_id);
        $this->assertNotNull($pivot->volume_id);
        $this->assertNotNull($pivot->created_at);
        $this->assertNotNull($pivot->updated_at);
    }

    public function testVolumeOnDeleteCascade()
    {
        $this->assertNotNull(ProjectVolume::find($this->model->id));
        $this->model->volume()->delete();
        $this->assertNull(ProjectVolume::find($this->model->id));
    }

    public function testProjectOnDeleteRestrict()
    {
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->project()->delete();
    }

    public function testUniqueProperties()
    {
        $this->setExpectedException('Illuminate\Database\QueryException');
        self::create([
            'project_id' => $this->model->project_id,
            'volume_id' => $this->model->volume_id,
        ]);
    }
}
