<?php

use Dias\Role;

class ApiTestCase extends TestCase {

	protected $project;
	protected $admin;
	protected $editor;
	protected $guest;
	protected $user;

	protected $globalAdmin;

	public function setUp()
	{
		parent::setUp();
		Session::start();

		$this->project = ProjectTest::create();
		$this->project->save();

		$this->admin = $this->newProjectUser(Role::adminId());
		$this->editor = $this->newProjectUser(Role::editorId());
		$this->guest = $this->newProjectUser(Role::guestId());

		$this->user = $this->newProjectUser(Role::guestId());
		$this->project->removeUserId($this->user->id);

		$this->globalAdmin = $this->newProjectUser(Role::guestId());
		$this->project->removeUserId($this->user->id);
		$this->globalAdmin->role()->associate(Role::admin());
		$this->globalAdmin->save();
	}

	private function newProjectUser($roleId)
	{
		$user = UserTest::create();
		$user->generateApiKey();
		$user->save();
		$this->project->addUserId($user->id, $roleId);
		return $user;
	}

	/*
	 * Simulates an AJAX request.
	 */
	protected function callAjax($method, $uri, $params = [])
	{
		return $this->call($method, $uri, $params, [], [], array('HTTP_X-Requested-With' => 'XMLHttpRequest'));
	}

	/*
	 * Performs a call with API token authorization.
	 */
	protected function callToken($method, $uri, $user, $params = [])
	{
		return $this->call($method, $uri, $params, [], [], array('HTTP_Authorization' => 'token '.$user->api_key));
	}

	/*
	 * Tests the existence of an API route.
	 */
	protected function doTestApiRoute($method, $uri)
	{
		$this->call($method, $uri);
		if ($method === 'GET')
		{
			$this->assertResponseStatus(401);
		}
		else
		{
			// token mismatch
			$this->assertResponseStatus(403);

			$this->call($method, $uri, array('_token' => Session::token()));
			// route exists (otherwise 404)
			$this->assertResponseStatus(401);
		}
	}
}