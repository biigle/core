<?php

use Dias\Label;

class LabelTest extends ModelWithAttributesTest
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\Label::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->color);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testColorRequired()
    {
        $this->model->color = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testParent()
    {
        $parent = self::create();
        $child = self::create(['parent_id' => $parent->id]);
        $this->assertEquals($parent->id, $child->parent->id);
    }

    public function testParentOnDeleteCascade()
    {
        $parent = self::create();
        $child = self::create(['parent_id' => $parent->id]);
        $parent->delete();
        $this->assertNull($child->fresh());
    }

    public function testProject()
    {
        $project = ProjectTest::create();
        $label = self::create(['project_id' => $project->id]);
        $this->assertEquals($project->id, $label->project->id);
    }

    public function testProjectOnDeleteCascade()
    {
        // adding foreign keys doesn't work for SQLite, test this with Postgres instead
        if (!(DB::connection() instanceof Illuminate\Database\SQLiteConnection)) {
            $project = ProjectTest::create();
            $label = self::create(['project_id' => $project->id]);
            $project->delete();
            $this->assertNull($label->fresh());
        }
    }

    public function testChildren()
    {
        $parent = self::create();
        $child = self::create(['parent_id' => $parent->id]);
        $this->assertEquals($child->id, $parent->children()->first()->id);
    }

    public function testHasChildren()
    {
        $parent = self::create();
        $child = self::create();
        $this->assertFalse($parent->hasChildren);
        $child->parent()->associate($parent);
        $child->save();
        $this->assertTrue($parent->hasChildren);
    }
}
