<?php

use Dias\Role;

class ApiTestCase extends TestCase {

	protected $project;
	protected $admin;
	protected $adminCredentials;
	protected $editor;
	protected $editorCredentials;
	protected $guest;
	protected $guestCredentials;
	protected $user;
	protected $userCredentials;

	protected $globalAdmin;
	protected $globalAdminCredentials;

	public function setUp()
	{
		parent::setUp();
		Session::start();

		$this->project = ProjectTest::create();
		$this->project->save();

		$this->admin = $this->newProjectUser(Role::adminId());
		$this->adminCredentials = array('HTTP_Authorization' => 'token '.$this->admin->api_key);
		$this->editor = $this->newProjectUser(Role::editorId());
		$this->editorCredentials = array('HTTP_Authorization' => 'token '.$this->editor->api_key);
		$this->guest = $this->newProjectUser(Role::guestId());
		$this->guestCredentials = array('HTTP_Authorization' => 'token '.$this->guest->api_key);

		$this->user = $this->newProjectUser(Role::guestId());
		$this->project->removeUserId($this->user->id);
		$this->userCredentials = array('HTTP_Authorization' => 'token '.$this->user->api_key);

		$this->globalAdmin = $this->newProjectUser(Role::guestId());
		$this->project->removeUserId($this->user->id);
		$this->globalAdmin->role()->associate(Role::admin());
		$this->globalAdminCredentials = array('HTTP_Authorization' => 'token '.$this->globalAdmin->api_key);
	}

	private function newProjectUser($roleId)
	{
		$user = UserTest::create();
		$user->generateApiKey();
		$user->save();
		$this->project->addUserId($user->id, $roleId);
		return $user;
	}
}