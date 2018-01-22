<?php

namespace Biigle\Tests;

use DB;
use TestCase;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;

class ProjectVolumeTest extends TestCase
{
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

    public function testProjectOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $project->volumes()->attach(VolumeTest::create());
        $pivot = $project->volumes()->first()->pivot;
        $this->assertNotNull(DB::table('project_volume')->find($pivot->id));
        $project->delete();
        $this->assertNull(DB::table('project_volume')->find($pivot->id));
    }

    public function testVolumeOnDeleteRestrict()
    {
        $project = ProjectTest::create();
        $project->volumes()->attach(VolumeTest::create());
        $this->setExpectedException('Illuminate\Database\QueryException');
        $project->volumes()->delete();
    }

    public function testUniqueProperties()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::create();
        $project->volumes()->attach($volume);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $project->volumes()->attach($volume);
    }
}
