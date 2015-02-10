<?php

use Dias\Annotation;

class AnnotationTest extends TestCase {

	public static function create($image = false, $shape = false)
	{
		$obj = new Annotation;
		$image = $image ? $image : $image = ImageTest::create();
		$image->save();
		$obj->image()->associate($image);
		$shape = $shape ? $shape : $shape = ShapeTest::create();
		$shape->save();
		$obj->shape()->associate($shape);
		return $obj;
	}

	public function testCreation()
	{
		$obj = AnnotationTest::create();
		$this->assertTrue($obj->save());
	}

	public function testAttributes()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$this->assertNotNull($annotation->image);
		$this->assertNotNull($annotation->shape);
		$this->assertNotNull($annotation->created_at);
		$this->assertNotNull($annotation->updated_at);
	}

	public function testImageOnDeleteCascade()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$this->assertNotNull(Annotation::find($annotation->id));
		$annotation->image()->delete();
		$this->assertNull(Annotation::find($annotation->id));
	}

	public function testShapeOnDeleteRestrict()
	{		
		$annotation = AnnotationTest::create();
		$annotation->save();
		$this->setExpectedException('Illuminate\Database\QueryException');
		$annotation->shape()->delete();
	}

	public function testPoints()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$point0 = AnnotationPointTest::create($annotation, 0);
		$point0->save();
		$point1 = AnnotationPointTest::create($annotation, 1);
		$point1->save();
		$this->assertEquals(2, $annotation->points()->count());
		$this->assertEquals($point0->index, $annotation->points()->first()->index);
	}

	public function testLabels()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$label = LabelTest::create();
		$label->save();
		$user = UserTest::create('a', 'b', 'c', 'd');
		$user->save();
		$annotation->labels()->attach($label->id, array(
			'confidence' => 0.5,
			'user_id' => $user->id
		));

		$this->assertEquals(1, $annotation->labels()->count());

		$label = $annotation->labels()->first();
		$this->assertEquals(0.5, $label->confidence);
		$this->assertEquals($user->id, $label->user_id);
	}

	public function testAttributeRelation()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$attribute = AttributeTest::create();
		$attribute->save();
		$annotation->attributes()->attach($attribute->id, array(
			'value_int'    => 123,
			'value_double' => 0.4,
			'value_string' => 'test'
		));

		$this->assertEquals(1, $annotation->attributes()->count());

		$attribute = $annotation->attributes()->first();
		$this->assertEquals(123, $attribute->pivot->value_int);
		$this->assertEquals(0.4, $attribute->pivot->value_double);
		$this->assertEquals('test', $attribute->pivot->value_string);
	}
}