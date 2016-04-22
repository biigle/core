<?php

use Dias\Role;
use Dias\Label;

class ApiTestCase extends TestCase
{
    private $project;
    private $transect;
    private $admin;
    private $editor;
    private $guest;
    private $user;

    private $globalAdmin;

    private $labelRoot;
    private $labelChild;

    private function newUser($role = null)
    {
        $user = UserTest::make();
        $user->generateApiKey();
        $user->role()->associate($role ? $role : Role::$editor);
        $user->save();

        return $user;
    }

    private function newProjectUser($role)
    {
        $user = $this->newUser();
        $this->project()->addUserId($user->id, $role->id);

        return $user;
    }

    protected function project()
    {
        if ($this->project) {
            return $this->project;
        }

        return $this->project = ProjectTest::create();
    }

    protected function transect()
    {
        if ($this->transect) {
            return $this->transect;
        }

        $this->transect = TransectTest::create();
        $this->project()->addTransectId($this->transect->id);

        return $this->transect;
    }

    protected function admin()
    {
        if ($this->admin) {
            return $this->admin;
        }

        return $this->admin = $this->newProjectUser(Role::$admin);
    }

    protected function editor()
    {
        if ($this->editor) {
            return $this->editor;
        }

        return $this->editor = $this->newProjectUser(Role::$editor);
    }

    protected function guest()
    {
        if ($this->guest) {
            return $this->guest;
        }

        return $this->guest = $this->newProjectUser(Role::$guest);
    }

    protected function user()
    {
        if ($this->user) {
            return $this->user;
        }

        return $this->user = $this->newUser();
    }

    protected function globalAdmin()
    {
        if ($this->globalAdmin) {
            return $this->globalAdmin;
        }

        return $this->globalAdmin = $this->newUser(Role::$admin);
    }

    protected function labelRoot()
    {
        if ($this->labelRoot) {
            return $this->labelRoot;
        }

        return $this->labelRoot = LabelTest::create(['name' => 'Test Root']);
    }

    protected function labelChild()
    {
        if ($this->labelChild) {
            return $this->labelChild;
        }

        return $this->labelChild = LabelTest::create([
            'name' => 'Test Child',
            'parent_id' => $this->labelRoot()->id,
        ]);
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
