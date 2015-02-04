<?php

class ProjectAPITest extends TestCase {

	public function setUp()
	{
		parent::setUp();
		Route::enableFilters();
		Session::start();
	}

	public function testAccessWhithoutLogin()
	{
		$crawler = $this->client->request('GET', '/api/v1/projects');
		$this->assertRedirectedToAction('HomeController@showLogin');
	}

	public function testAccessWhithLogin()
	{
		$user = UserTest::create();
		$this->be($user);
		$crawler = $this->client->request('GET', '/api/v1/projects');
		$this->assertResponseOk();
	}

	public function testIndex()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('a', 'b', 'c', 'd');
		$user->save();
		$this->be($user);
		
		$crawler = $this->client->request('GET', '/api/v1/projects');
		$this->assertEquals('[]', $this->client->getResponse()->getContent());

		$project->users()->attach($user->id, array('role_id' => 1));

		$crawler = $this->client->request('GET', '/api/v1/projects');
		$this->assertContains('"id":"1"', $this->client->getResponse()->getContent());
	}

	public function testShow()
	{
		$project = ProjectTest::create();
		$project->save();
		$user = UserTest::create('a', 'b', 'c', 'd');
		$user->save();
		$this->be($user);

		$crawler = $this->client->request('GET', '/api/v1/projects/1');
		$this->assertEquals('', $this->client->getResponse()->getContent());

		$project->users()->attach($user->id, array('role_id' => 1));

		$crawler = $this->client->request('GET', '/api/v1/projects/1');
		$this->assertContains('"id":"1"', $this->client->getResponse()->getContent());
	}
}