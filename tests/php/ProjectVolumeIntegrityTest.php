<?php

namespace Biigle\Tests;

use TestCase;

class ProjectVolumeIntegrityTest extends TestCase
{
    public function testVolumeOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::make();
        $project->volumes()->save($volume);
        $this->assertEquals(1, $project->volumes()->count());
        $volume->delete();
        $this->assertEquals(0, $project->volumes()->count());
    }

    public function testProjectOnDeleteRestrict()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::make();
        $project->volumes()->save($volume);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $project->delete();
    }

    public function testProjectVolumeUnique()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::make();
        $project->volumes()->save($volume);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $project->volumes()->save($volume);
    }
}
