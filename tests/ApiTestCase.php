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

        $this->project = ProjectTest::create();
        $transect = TransectTest::create();
        $this->project->addTransectId($transect->id);

        $this->admin = $this->newProjectUser(Role::$admin->id);
        $this->editor = $this->newProjectUser(Role::$editor->id);
        $this->guest = $this->newProjectUser(Role::$guest->id);

        $this->user = $this->newProjectUser(Role::$guest->id);
        $this->project->removeUserId($this->user->id);

        $this->globalAdmin = $this->newProjectUser(Role::$guest->id);
        $this->project->removeUserId($this->user->id);
        $this->globalAdmin->role()->associate(Role::$admin);
        $this->globalAdmin->save();

        $this->labelRoot = LabelTest::create(['name' => 'Test Root']);

        $this->labelChild = LabelTest::create([
            'name' => 'Test Child',
            'parent_id' => $this->labelRoot->id,
        ]);
    }

    private function newProjectUser($roleId)
    {
        $user = UserTest::make();
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
