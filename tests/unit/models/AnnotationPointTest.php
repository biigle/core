<?php

use Dias\AnnotationPoint;

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
		$obj = AnnotationPointTest::create();
		$obj->annotation()->dissociate();
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}

	public function testIndexRequired()
	{
		$obj = AnnotationPointTest::create();
		$obj->index = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}

	public function testXRequired()
	{
		$obj = AnnotationPointTest::create();
		$obj->x = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
		$obj->save();
	}

	public function testYRequired()
	{
		$obj = AnnotationPointTest::create();
		$obj->y = null;
		$this->setExpectedException('Illuminate\Database\QueryException');
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
		$annotation = AnnotationTest::create();
		AnnotationPointTest::create($annotation)->save();
		$this->setExpectedException('Illuminate\Database\QueryException');
		AnnotationPointTest::create($annotation)->save();
	}

	public function testProjectIds()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$point = $annotation->addPoint(10, 10);
		$project = ProjectTest::create();
		$project->save();
		$transect = $annotation->image->transect;

		$this->assertEmpty($point->projectIds());
		$project->addTransectId($transect->id);
		// clear caching of previous call
		Cache::flush();
		$ids = $point->projectIds();
		$this->assertNotEmpty($ids);
		$this->assertEquals($project->id, $ids[0]);
	}
}