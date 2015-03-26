<?php

class ImageAnnotationApiTest extends ApiTestCase {

	private $image;

	public function setUp()
	{
		parent::setUp();
		$this->image = ImageTest::create();
		$this->image->save();
		$this->project->addTransectId($this->image->transect->id);
	}

	public function testIndex()
	{
		$annotation = AnnotationTest::create($this->image);
		$annotation->save();

		$this->doTestApiRoute('GET',
			'/api/v1/images/'.$this->image->id.'/annotations'
		);

		// api key authentication
		$this->callToken('GET',
			'/api/v1/images/'.$this->image->id.'/annotations',
			$this->user
		);
		$this->assertResponseStatus(401);

		$this->callToken('GET',
			'/api/v1/images/'.$this->image->id.'/annotations',
			$this->guest
		);
		$this->assertResponseOk();

		// session cookie authentication
		$this->be($this->guest);
		$r = $this->call('GET',
			'/api/v1/images/'.$this->image->id.'/annotations'
		);
		// response should not be an empty array
		$this->assertStringStartsWith('[{', $r->getContent());
		$this->assertStringEndsWith('}]', $r->getContent());
	}

	public function testStore()
	{
		$this->doTestApiRoute('POST',
			'/api/v1/images/'.$this->image->id.'/annotations'
		);

		// api key authentication
		$this->callToken('POST',
			'/api/v1/images/'.$this->image->id.'/annotations',
			$this->guest
		);
		$this->assertResponseStatus(401);

		$this->callToken('POST',
			'/api/v1/images/'.$this->image->id.'/annotations',
			$this->editor
		);
		// missing arguments
		$this->assertResponseStatus(422);

		// session cookie authentication
		$this->be($this->editor);

		$this->callAjax('POST',
			'/api/v1/images/'.$this->image->id.'/annotations',
			array(
				'_token' => Session::token(),
				'shape_id' => 99999,
				'points' => ''
			)
		);
		// shape does not exist
		$this->assertResponseStatus(422);

		$this->call('POST',
			'/api/v1/images/'.$this->image->id.'/annotations',
			array(
				'_token' => Session::token(),
				'shape_id' => \Dias\Shape::lineId(),
				'points' => '[]'
			)
		);
		// at least one point required
		$this->assertResponseStatus(400);

		$r = $this->call('POST',
			'/api/v1/images/'.$this->image->id.'/annotations',
			array(
				'_token' => Session::token(),
				'shape_id' => \Dias\Shape::pointId(),
				'points' => '[{"x": 10, "y": 11}]'
			)
		);
		$this->assertResponseOk();

		$annotation = $this->image->annotations->first();
		$this->assertNotNull($annotation);

		$point = $annotation->points()->first();
		$this->assertEquals(10, $point->x);
		$this->assertEquals(11, $point->y);
	}
}