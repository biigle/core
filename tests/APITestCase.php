<?php

class APITestCase extends TestCase {

	protected $user;
	protected $credentials;

	public function setUp()
	{
		parent::setUp();
		$this->user = UserTest::create('joe', 'user', 'password', 'm@i.l');
		$this->user->save();
		$this->user->generateAPIKey();
		$this->credentials = array('HTTP_Authorization' => 'token '.$this->user->api_key);
	}
}