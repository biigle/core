<?php

namespace Biigle\Tests;

use TestCase;
use Biigle\Role;

class LabelTreeProjectIntegrityTest extends TestCase
{
    public function testLabelTreeOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $tree = LabelTreeTest::create();
        $tree->projects()->attach($project->id);

        $this->assertTrue($project->labelTrees()->where('id', $tree->id)->exists());
        $tree->delete();
        $this->assertFalse($project->labelTrees()->where('id', $tree->id)->exists());
    }

    public function testProjectOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $tree = LabelTreeTest::create();
        $tree->projects()->attach($project->id);

        $this->assertTrue($tree->projects()->exists());
        $project->delete();
        $this->assertFalse($tree->projects()->exists());
    }

    public function testProjectLabelTreeUnique()
    {
        $project = ProjectTest::create();
        $tree = LabelTreeTest::create();
        $tree->projects()->attach($project->id);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $tree->projects()->attach($project->id);
    }
}
