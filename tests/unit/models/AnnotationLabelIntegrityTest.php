<?php

class AnnotationLabelIntegrityTest extends TestCase {

	public function testAnnotationOnDeleteCascade()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$label = LabelTest::create();
		$label->save();
		$user = UserTest::create();
		$user->save();
		$annotation->labels()->attach($label->id, array(
			'confidence' => 0.5,
			'user_id' => $user->id
		));

		$this->assertEquals(1, $annotation->labels()->count());
		$annotation->delete();
		$this->assertEquals(0, $annotation->labels()->count());
	}

	public function testLabelOnDeleteRestrict()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$label = LabelTest::create();
		$label->save();
		$user = UserTest::create();
		$user->save();
		$annotation->labels()->attach($label->id, array(
			'confidence' => 0.5,
			'user_id' => $user->id
		));

		$this->setExpectedException('Illuminate\Database\QueryException');
		$label->delete();
	}

	public function testUserOnDeleteSetNull()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$label = LabelTest::create();
		$label->save();
		$user = UserTest::create();
		$user->save();
		$annotation->labels()->attach($label->id, array(
			'confidence' => 0.5,
			'user_id' => $user->id
		));

		$this->assertNotNull($annotation->labels()->first()->user_id);
		$user->delete();
		$this->assertNull($annotation->labels()->first()->user_id);
	}

	public function testAnnotationLabelUserUnique()
	{
		$annotation = AnnotationTest::create();
		$annotation->save();
		$label = LabelTest::create();
		$label->save();
		$user = UserTest::create();
		$user->save();
		$annotation->labels()->attach($label->id, array(
			'confidence' => 0.5,
			'user_id' => $user->id
		));

		$this->setExpectedException('Illuminate\Database\QueryException');
		$annotation->labels()->attach($label->id, array(
			'confidence' => 0.1,
			'user_id' => $user->id
		));
	}
}