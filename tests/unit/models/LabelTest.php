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
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
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

    public function testChildren()
    {
        $parent = self::create();
        $child = self::create(['parent_id' => $parent->id]);
        $this->assertEquals($child->id, $parent->children()->first()->id);
    }

    public function testHasParent()
    {
        $parent = self::create();
        $child = self::create();
        $this->assertFalse($child->hasParent);
        $child->parent()->associate($parent);
        $this->assertTrue($child->hasParent);
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
