<?php

class AnnotationAPITest extends TestCase {

	private $user;
	private $credentials;

	public function setUp()
	{
		parent::setUp();
		$this->user = UserTest::create('joe', 'user', 'password', 'm@i.l');
		$this->user->save();
		$this->user->generateAPIKey();
		$this->credentials = array('HTTP_Authorization' => 'token '.$this->user->api_key);

		// create a test annotation
		$annotation = AnnotationTest::create();
		$annotation->save();
		$label = LabelTest::create();
		$label->save();
		$annotation->labels()->attach($label->id, array(
			'confidence' => 0.5,
			'user_id' => $this->user->id
		));

		// another annotation not belonging to the user
		$annotation = AnnotationTest::create($annotation->image, $annotation->shape);
		$annotation->save();
		$annotation->labels()->attach($label->id, array(
			'confidence' => 0.2,
			'user_id' => 2
		));
	}

	// public function testAnnotationAPIIndex()
	// {
	// 	// typical index uri should not respond to GET (method not allowed)
	// 	$this->call('GET', '/api/v1/annotations');
	// 	$this->assertResponseStatus(405);

	// 	// call without authentication fails
	// 	$this->call('GET', '/api/v1/annotations/my');
	// 	$this->assertResponseStatus(401);
		
	// 	// authentication with API key passes
	// 	$this->call('GET', '/api/v1/annotations/my', [], [], [], $this->credentials);
	// 	$this->assertResponseOk();

	// 	// authentication with session cookie passes
	// 	$this->be($this->user);
	// 	$r = $this->call('GET', '/api/v1/annotations/my');
	// 	$this->assertResponseOk();

	// 	// pivot table data shouldn't be returned
	// 	$this->assertContains('"id":"1","image_id":"1"', $r->getContent());
	// 	$this->assertNotContains('pivot', $r->getContent());
	// }

	// public function testAnnotationAPIShow()
	// {
	// 	$this->call('GET', '/api/v1/annotations/1');
	// 	$this->assertResponseStatus(401);
		
	// 	// authentication with API key passes
	// 	$this->call('GET', '/api/v1/annotations/1', [], [], [], $this->credentials);
	// 	$this->assertResponseOk();

	// 	// annotations not belonging to the user are forbidden
	// 	$this->call('GET', '/api/v1/annotations/2', [], [], [], $this->credentials);
	// 	$this->assertResponseStatus(401);

	// 	// authentication with session cookie passes
	// 	$this->be($this->user);
	// 	$r = $this->call('GET', '/api/v1/annotations/1');
	// 	$this->assertResponseOk();

	// 	// annotations not belonging to the user are forbidden
	// 	$this->call('GET', '/api/v1/annotations/2');
	// 	$this->assertResponseStatus(401);

	// 	// pivot table data shouldn't be returned
	// 	$this->assertContains('"id":"1","image_id":"1"', $r->getContent());
	// 	$this->assertContains('labels":[', $r->getContent());
	// 	$this->assertContains('points":[', $r->getContent());
	// 	$this->assertContains('confidence', $r->getContent());
	// 	$this->assertContains('user_id', $r->getContent());
	// 	$this->assertNotContains('pivot', $r->getContent());
	// }
}