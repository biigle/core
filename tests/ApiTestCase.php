<?php

use Dias\Role;
use Dias\Label;

class ApiTestCase extends TestCase
{
    protected $project;
    protected $admin;
    protected $editor;
    protected $guest;
    protected $user;

    protected $globalAdmin;

    protected $labelRoot;
    protected $labelChild;

    public function setUp()
    {
        parent::setUp();
        Session::start();

        $this->project = ProjectTest::create();
        $this->project->save();

        $transect = TransectTest::create();
        $transect->save();
        $this->project->addTransectId($transect->id);

        $this->admin = $this->newProjectUser(Role::adminId());
        $this->editor = $this->newProjectUser(Role::editorId());
        $this->guest = $this->newProjectUser(Role::guestId());

        $this->user = $this->newProjectUser(Role::guestId());
        $this->project->removeUserId($this->user->id);

        $this->globalAdmin = $this->newProjectUser(Role::guestId());
        $this->project->removeUserId($this->user->id);
        $this->globalAdmin->role()->associate(Role::admin());
        $this->globalAdmin->save();

        $this->labelRoot = new Label;
        $this->labelRoot->name = 'Test Root';
        $this->labelRoot->save();

        $this->labelChild = new Label;
        $this->labelChild->name = 'Test Child';
        $this->labelChild->parent_id = $this->labelRoot->id;
        $this->labelChild->save();
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
        return $this->call($method, $uri, $params, [], [], [
            'HTTP_X-Requested-With' => 'XMLHttpRequest',
        ]);
    }

    /*
     * Simulates an JSON request.
     */
    protected function callJSON($method, $uri, $params = [])
    {
        return $this->call($method, $uri, $params, [], [], [
            'HTTP_Content-Type' => 'application/json',
        ]);
    }

    /*
     * Performs a call with API token authorization.
     */
    protected function callToken($method, $uri, $user, $params = [])
    {
        return $this->call($method, $uri, $params, [], [], [
            'HTTP_X-Auth-Token' => $user->api_key,
        ]);
    }

    /*
     * Tests the existence of an API route.
     */
    protected function doTestApiRoute($method, $uri)
    {
        $this->call($method, $uri);
        if ($method === 'GET') {
            $this->assertResponseStatus(401);
        } else {
            // token mismatch
            $this->assertResponseStatus(403);

            $this->call($method, $uri, ['_token' => Session::token()]);
            // route exists (otherwise 404)
            $this->assertResponseStatus(401);
        }
    }
}
