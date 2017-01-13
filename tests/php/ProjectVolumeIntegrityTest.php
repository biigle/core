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
        if ($this->isSqlite()) {
            $this->markTestSkipped('Can\'t test with SQLite because altering foreign key constraints is not supported.');
        }
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
