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
		$this->assertEquals(0, $annotation->points()->count());
		$point0 = AnnotationPointTest::create($annotation, 0);
		$point0->save();
		$this->assertEquals(1, $annotation->points()->count());
		$point1 = AnnotationPointTest::create($annotation, 1);
		$point1->save();
		$this->assertEquals(2, $annotation->points()->count());
	}

	public function testLabels()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$label = LabelTest::create();
		$label->save();
		$user = UserTest::create();
		$user->save();

		$annotationLabel = AnnotationLabelTest::create(
			$annotation, $label, $user, 0.5
		);
		$annotationLabel->save();

		$this->assertEquals(1, $annotation->labels()->count());

		$label = $annotation->labels()->first();
		$this->assertEquals(0.5, $label->confidence);
		$this->assertEquals($user->id, $label->user->id);
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

	public function testProjectIds()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$project = ProjectTest::create();
		$project->save();
		$transect = $annotation->image->transect;

		$this->assertEmpty($annotation->projectIds());
		$project->addTransectId($transect->id);
		// clear caching of previous call
		Cache::flush();
		$ids = $annotation->projectIds();
		$this->assertNotEmpty($ids);
		$this->assertEquals($project->id, $ids[0]);
	}

	public function testAddPoint()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();

		$this->assertEquals(0, $annotation->points()->count());

		// float will be converted to int
		$point = $annotation->addPoint(10.5, 10.22);

		$this->assertEquals($annotation->id, $point->annotation->id);
		$this->assertEquals(1, $annotation->points()->count());
		$this->assertEquals(0, $point->index);

		// the next point should get the next highest index
		$point = $annotation->addPoint(20, 20);
		$this->assertEquals(2, $annotation->points()->count());
		$this->assertEquals(1, $point->index);
	}

	public function testAddPoints()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();

		$this->assertEquals(0, $annotation->points()->count());

		$annotation->addPoints(array(
			array('x' => 10, 'y' => 10)
		));

		$this->assertEquals(1, $annotation->points()->count());

		$annotation->addPoints(array(
			(object) array('x' => 10, 'y' => 10)
		));

		$this->assertEquals(2, $annotation->points()->count());
	}

	public function testRefreshPoints()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();

		$annotation->addPoints(array(
			array('x' => 10, 'y' => 10),
			array('x' => 20, 'y' => 20)
		));

		$this->assertEquals(2, $annotation->points()->count());

		$annotation->refreshPoints(array(
			array('x' => 100, 'y' => 100),
			array('x' => 200, 'y' => 200)
		));

		$this->assertEquals(2, $annotation->points()->count());

		$points = $annotation->points->toArray();
		$this->assertEquals(100, $points[0]['x']);
		$this->assertEquals(200, $points[1]['x']);

		$annotation->refreshPoints(array());
		$this->assertEquals(2, $annotation->points()->count());
	}

	public function testAddLabel()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$user = UserTest::create();
		$user->save();
		$labelId = 1;
		$confidence = 0.1;

		$this->assertEquals(0, $annotation->labels()->count());

		$point = $annotation->addLabel($labelId, $confidence, $user);

		$this->assertEquals(1, $annotation->labels()->count());
		
		$label = $annotation->labels()->first();

		$this->assertEquals($labelId, $label->id);
		$this->assertEquals($confidence, $label->confidence);
		$this->assertEquals($user->id, $label->user_id);
	}
}