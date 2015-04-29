<?php

use Dias\AnnotationLabel;

class AnnotationLabelTest extends TestCase {

	public static function create($annotation = false, $label = false, $user = false, $confidence = 0.0)
	{
		$obj = new AnnotationLabel;
		$annotation = $annotation ? $annotation : AnnotationTest::create();
		$annotation->save();
		$obj->annotation()->associate($annotation);
		$label = $label ? $label : LabelTest::create();
		$label->save();
		$obj->label()->associate($label);
		$user = $user ? $user : UserTest::create();
		$user->save();
		$obj->user()->associate($user);
		$obj->confidence = $confidence;
		return $obj;
	}

	public function testCreation()
	{
		$obj = AnnotationLabelTest::create();
		$this->assertTrue($obj->save());
	}

	public function testAttributes()
	{
		$annotationLabel = AnnotationLabelTest::create();
		$annotationLabel->save();
		$this->assertNotNull($annotationLabel->annotation);
		$this->assertNotNull($annotationLabel->label);
		$this->assertNotNull($annotationLabel->user);
		$this->assertNotNull($annotationLabel->created_at);
		$this->assertNotNull($annotationLabel->updated_at);
	}

	public function testHiddenAttributes()
	{
		// API key mustn't show up in the JSON
		$json = json_decode((string) AnnotationLabelTest::create());
		$this->assertObjectNotHasAttribute('label_id', $json);
		$this->assertObjectNotHasAttribute('user_id', $json);
		$this->assertObjectNotHasAttribute('annotation_id', $json);
		$this->assertObjectHasAttribute('confidence', $json);
	}

	public function testAnnotationOnDeleteCascade()
	{
		$annotationLabel = AnnotationLabelTest::create();
		$annotationLabel->save();
		$this->assertNotNull(AnnotationLabel::find($annotationLabel->id));
		$annotationLabel->annotation()->delete();
		$this->assertNull(AnnotationLabel::find($annotationLabel->id));
	}

	public function testLabelOnDeleteRestrict()
	{
		$annotationLabel = AnnotationLabelTest::create();
		$annotationLabel->save();
		$this->assertNotNull(AnnotationLabel::find($annotationLabel->id));
		$this->setExpectedException('Illuminate\Database\QueryException');
		$annotationLabel->label()->delete();
	}

	public function testUserOnDeleteSetNull()
	{
		$annotationLabel = AnnotationLabelTest::create();
		$annotationLabel->save();
		$this->assertNotNull($annotationLabel->fresh()->user);
		$annotationLabel->user->delete();
		$this->assertNull($annotationLabel->fresh()->user);
	}

	public function testUniqueProperties()
	{
		$annotationLabel = AnnotationLabelTest::create();
		$annotationLabel->save();
		
		$test = AnnotationLabelTest::create(
			$annotationLabel->annotation,
			$annotationLabel->label,
			$annotationLabel->user
		);
		$this->setExpectedException('Illuminate\Database\QueryException');
		$test->save();
	}
}