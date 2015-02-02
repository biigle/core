<?php

class UserApiTest extends TestCase {

	public function setUp()
	{
		parent::setUp();
		Route::enableFilters();
		Session::start();
	}

	/**
	* A basic functional test example.
	*
	* @return void
	*/
	public function testRequestWithoutLogin()
	{
		Auth::shouldReceive('guest')->once()->andReturn(true);

		$crawler = $this->client->request('GET', 'api/v1/users');
		$this->assertRedirectedToAction('HomeController@showLogin');
	}

	public function testRequestWithLogin()
	{
		Auth::shouldReceive('guest')->once()->andReturn(false);

		$crawler = $this->client->request('GET', 'api/v1/users');
		$this->assertResponseOk();
	}
}