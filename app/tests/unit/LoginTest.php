<?php

class LoginTest extends TestCase {

	public function setUp()
	{
		parent::setUp();
		// $this->mock = Mockery::mock('Eloquent', 'User');
	}

	public function tearDown()
	{
		// Mockery::close();
		parent::tearDown();
	}
	
	/**
	* A basic functional test example.
	*
	* @return void
	*/
	public function testLoginViewRedirect()
	{
		$crawler = $this->client->request('GET', '/');
		$this->assertRedirectedToAction('HomeController@showLogin');
	}

	public function testLoginView()
	{
		$crawler = $this->client->request('GET', 'login');
		$this->assertResponseOk();
	}

	public function testLoginDbCall()
	{
		$crawler = $this->client->request('POST', 'login', array(
			'_token'   => Session::getToken(),
			'email'    => 'joe@user.com',
			'password' => 'example'
		));

		$this->assertResponseStatus(302);
	}
}