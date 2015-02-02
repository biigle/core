<?php

class LoginTest extends TestCase {

	public function setUp()
	{
		parent::setUp();
		Route::enableFilters();
		Session::start();
		// $this->mock = Mockery::mock('Auth');
	}

	// public function tearDown()
	// {
	// 	Mockery::close();
	// 	parent::tearDown();
	// }
	
	/**
	* A basic functional test example.
	*
	* @return void
	*/
	public function testLoginViewRedirect()
	{
		$crawler = $this->client->request('GET', '/');
		$this->assertRedirectedToAction('HomeController@showLogin');
		$crawler = $this->client->request('POST', '/');
		$this->assertRedirectedToAction('HomeController@showLogin');
	}

	public function testLoginView()
	{
		$crawler = $this->client->request('GET', 'login');
		$this->assertResponseOk();
	}

	public function testLoginCsrf()
	{
		Auth::shouldReceive('attempt')->once()->andReturn(true);

		$this->setExpectedException('Illuminate\Session\TokenMismatchException');

		$crawler = $this->client->request('POST', 'login', array(
			'email'    => 'joe@user.com',
			'password' => 'example'
		));

		$this->assertRedirectedToAction('HomeController@showLogin');
	}

	public function testLoginFail()
	{
		Auth::shouldReceive('attempt')->once()->andReturn(false);

		$crawler = $this->client->request('POST', 'login', array(
			'_token'   => Session::getToken(),
			'email'    => 'joe@user.com',
			'password' => 'example'
		));

		$this->assertRedirectedToAction('HomeController@showLogin');
	}

	public function testLogin()
	{
		Auth::shouldReceive('attempt')->once()->andReturn(true);

		$crawler = $this->client->request('POST', 'login', array(
			'_token'   => Session::getToken(),
			'email'    => 'joe@user.com',
			'password' => 'example'
		));

		$this->assertRedirectedToAction('DashboardController@showDashboard');
	}
}