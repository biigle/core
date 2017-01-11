<?php

namespace Biigle\Tests;

use TestCase;

class ProjectTransectIntegrityTest extends TestCase
{
    public function testTransectOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::make();
        $project->transects()->save($transect);
        $this->assertEquals(1, $project->transects()->count());
        $transect->delete();
        $this->assertEquals(0, $project->transects()->count());
    }

    public function testProjectOnDeleteRestrict()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::make();
        $project->transects()->save($transect);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $project->delete();
    }

    public function testProjectTransectUnique()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::make();
        $project->transects()->save($transect);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $project->transects()->save($transect);
    }
}
