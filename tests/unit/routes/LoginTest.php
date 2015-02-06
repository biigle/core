<?php

class LoginTest extends TestCase {

	public function setUp()
	{
		parent::setUp();
		// enable XSRF tokens
		Session::start();
	}

	/**
	* A basic functional test example.
	*
	* @return void
	*/
	public function testLoginViewRedirect()
	{
		$user = UserTest::create('a', 'a', 'example123', 'joe@user.com');
		$user->save();
		$this->call('GET', '/');
		$this->assertRedirectedTo('/auth/login');

		$this->be($user);
		$this->call('GET', '/');
		$this->assertResponseOk();
	}

	public function testLoginView()
	{
		$this->call('GET', '/auth/login');
		$this->assertResponseOk();
	}

	public function testLoginXSRF()
	{
		// user would be able to log in
		UserTest::create('a', 'a', 'example123', 'joe@user.com')->save();

		$this->call('POST', '/auth/login', array(
			'email'    => 'joe@user.com',
			'password' => 'example123'
		));

		// but request fails because of missing XSRF token
		$this->assertResponseStatus(403);
	}

	public function testLoginFail()
	{
		// user doesn't exist
		$response = $this->call('POST', '/auth/login', array(
			'_token'   => Session::getToken(),
			'email'    => 'joe@user.com',
			'password' => 'example123'
		));

		$this->assertRedirectedTo('/auth/login');
	}

	public function testLoginSuccess()
	{
		UserTest::create('a', 'a', 'example123', 'joe@user.com')->save();

		$response = $this->call('POST', '/auth/login', array(
			'_token'   => Session::getToken(),
			'email'    => 'joe@user.com',
			'password' => 'example123'
		));

		$this->assertRedirectedTo('/');
	}
}