<?php

use Dias\Role;

class LabelTreeProjectIntegrityTest extends TestCase
{
    public function testLabelTreeOnDeleteCascade()
    {
        $tree = LabelTreeTest::create();
        $project = ProjectTest::create();
        $tree->projects()->attach($project->id);

        $this->assertTrue($project->labelTrees()->exists());
        $tree->delete();
        $this->assertFalse($project->labelTrees()->exists());
    }

    public function testProjectOnDeleteCascade()
    {
        $tree = LabelTreeTest::create();
        $project = ProjectTest::create();
        $tree->projects()->attach($project->id);

        $this->assertTrue($tree->projects()->exists());
        $project->delete();
        $this->assertFalse($tree->projects()->exists());
    }

    public function testProjectLabelTreeUnique()
    {
        $tree = LabelTreeTest::create();
        $project = ProjectTest::create();
        $tree->projects()->attach($project->id);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $tree->projects()->attach($project->id);
    }
}
