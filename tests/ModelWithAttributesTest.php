<?php

abstract class ModelWithAttributesTest extends ModelTestCase
{
    public function testAttributesExist()
    {
        $this->assertNotNull($this->model->attributes);
    }

    public function testAttributeRelation()
    {
        $attribute = AttributeTest::create();
        $this->assertEquals(0, $this->model->attributes()->count());
        $this->model->attributes()->save($attribute, [
            'value_int'    => 123,
            'value_double' => 0.4,
            'value_string' => 'test',
        ]);

        $this->assertEquals(1, $this->model->attributes()->count());

        $attribute = $this->model->attributes()->first();
        $this->assertEquals(123, $attribute->value_int);
        $this->assertEquals(0.4, $attribute->value_double);
        $this->assertEquals('test', $attribute->value_string);
    }

    public function testAttachDiasAttribute()
    {
        $attribute = AttributeTest::create(['name' => 'my-test', 'type' => 'integer']);

        $this->assertEquals(0, $this->model->attributes()->count());
        $this->model->attachDiasAttribute($attribute->name, 123);
        $this->assertEquals(1, $this->model->attributes()->count());

        $this->assertEquals(123, $this->model->attributes()->find($attribute->id)->value_int);

        $this->setExpectedException('Illuminate\Database\Eloquent\ModelNotFoundException');
        $this->model->attachDiasAttribute('does not exist', 123);
    }

    public function testGetDiasAttribute()
    {
        $attribute = AttributeTest::create(['name' => 'my-test', 'type' => 'integer']);

        $this->model->attachDiasAttribute('my-test', 123);

        $result = $this->model->getDiasAttribute('my-test');
        $this->assertEquals(123, $result->value_int);
        $this->assertEquals('my-test', $result->name);

        // model doesn't have this attribute
        $this->assertNull($this->model->getDiasAttribute('my-test123'));
    }

    public function testDetachDiasAttribute()
    {
        $attribute = AttributeTest::create(['name' => 'my-test', 'type' => 'integer']);
        $this->model->attachDiasAttribute('my-test', 123);

        $this->assertEquals(1, $this->model->attributes()->count());
        $this->model->detachDiasAttribute('my-test');
        $this->assertEquals(0, $this->model->attributes()->count());
    }

    public function testUpdateDiasAttribute()
    {
        $attribute = AttributeTest::create(['name' => 'my-test', 'type' => 'integer']);
        $this->model->attachDiasAttribute('my-test', 123);

        $this->assertEquals(123, $this->model->getDiasAttribute('my-test')->value_int);
        $this->model->updateDiasAttribute('my-test', 321);
        $this->assertEquals(321, $this->model->getDiasAttribute('my-test')->value_int);
    }

    // PIVOT TABLE INTEGRITY TESTS

    public function testAttributeOnDeleteRestrict()
    {
        $attribute = AttributeTest::create();
        $this->model->attributes()->save($attribute, [
            'value_int'    => 123,
            'value_double' => 0.4,
            'value_string' => 'test',
        ]);

        $this->setExpectedException('Illuminate\Database\QueryException');
        $attribute->delete();
    }

    public function testModelOnDeleteCascade()
    {
        $attribute = AttributeTest::create();
        $this->model->attributes()->save($attribute, [
            'value_int'    => 123,
            'value_double' => 0.4,
            'value_string' => 'test',
        ]);
        $this->assertNotNull($this->model->attributes()->first());
        $this->model->delete();
        $this->assertNull($this->model->attributes()->first());
        // only pivot table entry is deleted
        $this->assertNotNull($attribute->fresh());
    }

    public function testAttributeModelUnique()
    {
        $attribute = AttributeTest::create();
        $this->model->attributes()->save($attribute, [
            'value_int'    => 123,
            'value_double' => 0.4,
            'value_string' => 'test',
        ]);
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->attributes()->save($attribute, [
            'value_int'    => 321,
            'value_double' => 4.0,
            'value_string' => 'test',
        ]);
    }
}
