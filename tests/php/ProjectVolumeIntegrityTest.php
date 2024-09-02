<?php

namespace Biigle\Tests;

use Illuminate\Database\QueryException;
use TestCase;

class ProjectVolumeIntegrityTest extends TestCase
{
    public function testVolumeOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::make();
        $project->volumes()->save($volume);
        $this->assertSame(1, $project->volumes()->count());
        $volume->delete();
        $this->assertSame(0, $project->volumes()->count());
    }

    public function testProjectOnDeleteRestrict()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::make();
        $project->volumes()->save($volume);
        $this->expectException(QueryException::class);
        $project->delete();
    }

    public function testProjectVolumeUnique()
    {
        $project = ProjectTest::create();
        $volume = VolumeTest::make();
        $project->volumes()->save($volume);
        $this->expectException(QueryException::class);
        $project->volumes()->save($volume);
    }
}
