<?php

class AnnotationPointTest extends TestCase {

	public static function create($annotation = false, $idx = 0, $x = 0, $y = 0)
	{
		$obj = new AnnotationPoint;
		if (!$annotation) $annotation = AnnotationTest::create();
		$annotation->save();
		$obj->annotation()->associate($annotation);
		$obj->index = $idx;
		$obj->x = $x;
		$obj->y = $y;
		return $obj;
	}

	public function testCreation()
	{
		$obj = AnnotationPointTest::create();
		$this->assertTrue($obj->save());
	}

	public function testAttributes()
	{
		$point = AnnotationPointTest::create();
		$point->save();
		$this->assertNotNull($point->annotation);
		$this->assertNotNull($point->index);
		$this->assertNotNull($point->x);
		$this->assertNotNull($point->y);
		$this->assertNull($point->created_at);
		$this->assertNull($point->updated_at);
	}

	public function testAnnotationRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');

		$obj = AnnotationPointTest::create();
		$obj->annotation()->dissociate();
		$obj->save();
	}

	public function testIndexRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		
		$obj = AnnotationPointTest::create();
		$obj->index = null;
		$obj->save();
	}

	public function testXRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		
		$obj = AnnotationPointTest::create();
		$obj->x = null;
		$obj->save();
	}

	public function testYRequired()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		
		$obj = AnnotationPointTest::create();
		$obj->y = null;
		$obj->save();
	}

	public function testAnnotationOnDeleteCascade()
	{
		$annotation = AnnotationTest::create();
		$point = AnnotationPointTest::create($annotation);
		$point->save();
		$this->assertNotNull(AnnotationPoint::where('annotation_id', '=', $annotation->id)->first());
		$point->annotation()->delete();
		$this->assertNull(AnnotationPoint::where('annotation_id', '=', $annotation->id)->first());
	}

	public function testAnnotationIndexUnique()
	{
		$this->setExpectedException('Illuminate\Database\QueryException');
		
		$annotation = AnnotationTest::create();
		AnnotationPointTest::create($annotation)->save();
		AnnotationPointTest::create($annotation)->save();
	}
}