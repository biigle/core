<?php

namespace Biigle\Tests;

use TestCase;
use Illuminate\Database\QueryException;

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
        $this->expectException(QueryException::class);
        $tree->projects()->attach($project->id);
    }
}
