<?php

namespace Biigle\Tests;

use Illuminate\Database\QueryException;
use TestCase;

class LabelTreeAuthorizedProjectIntegrityTest extends TestCase
{
    public function testLabelTreeOnDeleteCascade()
    {
        $tree = LabelTreeTest::create();
        $project = ProjectTest::create();
        $tree->authorizedProjects()->attach($project->id);

        $this->assertTrue($project->authorizedLabelTrees()->exists());
        $tree->delete();
        $this->assertFalse($project->authorizedLabelTrees()->exists());
    }

    public function testProjectOnDeleteCascade()
    {
        $tree = LabelTreeTest::create();
        $project = ProjectTest::create();
        $tree->authorizedProjects()->attach($project->id);

        $this->assertTrue($tree->authorizedProjects()->exists());
        $project->delete();
        $this->assertFalse($tree->authorizedProjects()->exists());
    }

    public function testProjectLabelTreeUnique()
    {
        $tree = LabelTreeTest::create();
        $project = ProjectTest::create();
        $tree->authorizedProjects()->attach($project->id);
        $this->expectException(QueryException::class);
        $tree->authorizedProjects()->attach($project->id);
    }
}
