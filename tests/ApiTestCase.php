<?php

use Biigle\Role;
use Biigle\Label;
use Biigle\Visibility;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\LabelTreeTest;

class ApiTestCase extends TestCase
{
    private $project;
    private $volume;
    private $admin;
    private $editor;
    private $expert;
    private $guest;
    private $user;

    private $globalGuest;
    private $globalAdmin;

    private $labelTree;
    private $labelRoot;
    private $labelChild;

    private function newUser($role = null)
    {
        $user = UserTest::make();
        $user->role()->associate($role ? $role : Role::editor());
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

    protected function volume()
    {
        if ($this->volume) {
            return $this->volume;
        }

        $this->volume = VolumeTest::create();
        $this->project()->volumes()->attach($this->volume);

        return $this->volume;
    }

    protected function admin()
    {
        if ($this->admin) {
            return $this->admin;
        }

        return $this->admin = $this->newProjectUser(Role::admin());
    }

    protected function beAdmin()
    {
        $this->be($this->admin());
    }

    protected function expert()
    {
        if ($this->expert) {
            return $this->expert;
        }

        return $this->expert = $this->newProjectUser(Role::expert());
    }

    protected function beExpert()
    {
        $this->be($this->expert());
    }

    protected function editor()
    {
        if ($this->editor) {
            return $this->editor;
        }

        return $this->editor = $this->newProjectUser(Role::editor());
    }

    protected function beEditor()
    {
        $this->be($this->editor());
    }

    protected function guest()
    {
        if ($this->guest) {
            return $this->guest;
        }

        return $this->guest = $this->newProjectUser(Role::guest());
    }

    protected function beGuest()
    {
        $this->be($this->guest());
    }

    protected function user()
    {
        if ($this->user) {
            return $this->user;
        }

        return $this->user = $this->newUser();
    }

    protected function beUser()
    {
        $this->be($this->user());
    }

    protected function globalGuest()
    {
        if ($this->globalGuest) {
            return $this->globalGuest;
        }

        return $this->globalGuest = $this->newUser(Role::guest());
    }

    protected function beGlobalGuest()
    {
        $this->be($this->globalGuest());
    }

    protected function globalAdmin()
    {
        if ($this->globalAdmin) {
            return $this->globalAdmin;
        }

        return $this->globalAdmin = $this->newUser(Role::admin());
    }

    protected function beGlobalAdmin()
    {
        $this->be($this->globalAdmin());
    }

    protected function labelTree()
    {
        if ($this->labelTree) {
            return $this->labelTree;
        }

        // initialize project before label tree, else the tree (as global tree without members)
        // would be attached by default
        $this->project();

        $this->labelTree = $this->labelTree = LabelTreeTest::create([
            'visibility_id' => Visibility::publicId(),
        ]);

        $this->labelTree->projects()->attach($this->project());

        return $this->labelTree;
    }

    protected function labelRoot()
    {
        if ($this->labelRoot) {
            return $this->labelRoot;
        }

        return $this->labelRoot = LabelTest::create([
            'name' => 'Test Root',
            'label_tree_id' => $this->labelTree()->id,
        ]);
    }

    protected function labelChild()
    {
        if ($this->labelChild) {
            return $this->labelChild;
        }

        return $this->labelChild = LabelTest::create([
            'name' => 'Test Child',
            'parent_id' => $this->labelRoot()->id,
            'label_tree_id' => $this->labelTree()->id,
        ]);
    }

    /*
     * Simulates an AJAX request.
     */
    protected function ajax($method, $uri, $params = [])
    {
        return $this->call($method, $uri, $params, [], [], [
            'HTTP_X-Requested-With' => 'XMLHttpRequest',
        ]);
    }

    /*
     * Tests the existence of an API route.
     */
    protected function doTestApiRoute($method, $uri)
    {
        $this->json($method, $uri)->assertStatus(401);
        $this->call($method, $uri)->assertStatus(302);
    }
}
