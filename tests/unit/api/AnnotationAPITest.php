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
	}

	public function testProjectsAPIIndex()
	{
		// call without authentication fails
		$this->call('GET', '/api/v1/annotations/my');
		$this->assertResponseStatus(401);
		
		// authentication with API key passes
		$this->call('GET', '/api/v1/annotations/my', [], [], [], $this->credentials);
		$this->assertResponseOk();

		// authentication with session cookie passes
		$this->be($this->user);
		$this->call('GET', '/api/v1/annotations/my');
		$this->assertResponseOk();
	}
}