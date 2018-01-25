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
    private $projectVolume;
    private $admin;
    private $editor;
    private $guest;
    private $user;

    private $globalAdmin;

    private $labelTree;
    private $labelRoot;
    private $labelChild;

    private function newUser($role = null)
    {
        $user = UserTest::make();
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
        if (!$this->project) {
            $this->project = ProjectTest::create();
        }

        return $this->project;
    }

    protected function volume()
    {
        if (!$this->volume) {
            $this->volume = VolumeTest::create([
                'visibility_id' => Visibility::$public->id,
            ]);
            $this->project()->volumes()->attach($this->volume);
        }

        return $this->volume;
    }

    protected function projectVolume()
    {
        if (!$this->projectVolume) {
            $this->projectVolume = $this->project()->volumes()->find($this->volume()->id)->pivot;
        }

        return $this->projectVolume;
    }

    protected function admin()
    {
        if (!$this->admin) {
            $this->admin = $this->newProjectUser(Role::$admin);
        }

        return $this->admin;
    }

    protected function beAdmin()
    {
        $this->be($this->admin());
    }

    protected function editor()
    {
        if (!$this->editor) {
            $this->editor = $this->newProjectUser(Role::$editor);
        }

        return $this->editor;
    }

    protected function beEditor()
    {
        $this->be($this->editor());
    }

    protected function guest()
    {
        if (!$this->guest) {
            $this->guest = $this->newProjectUser(Role::$guest);
        }

        return $this->guest;
    }

    protected function beGuest()
    {
        $this->be($this->guest());
    }

    protected function user()
    {
        if (!$this->user) {
            $this->user = $this->newUser();
        }

        return $this->user;
    }

    protected function beUser()
    {
        $this->be($this->user());
    }

    protected function globalAdmin()
    {
        if (!$this->globalAdmin) {
            $this->globalAdmin = $this->newUser(Role::$admin);
        }

        return $this->globalAdmin;
    }

    protected function beGlobalAdmin()
    {
        $this->be($this->globalAdmin());
    }

    protected function labelTree()
    {
        if (!$this->labelTree) {
            // Initialize project before label tree, else the tree (as global tree
            // without members) would be attached by default
            $this->project();

            $this->labelTree = LabelTreeTest::create([
                'visibility_id' => Visibility::$public->id,
            ]);

            $this->labelTree->projects()->attach($this->project());
        }


        return $this->labelTree;
    }

    protected function labelRoot()
    {
        if (!$this->labelRoot) {
            $this->labelRoot = LabelTest::create([
                'name' => 'Test Root',
                'label_tree_id' => $this->labelTree()->id,
            ]);
        }

        return $this->labelRoot;
    }

    protected function labelChild()
    {
        if (!$this->labelChild) {
            $this->labelChild = LabelTest::create([
                'name' => 'Test Child',
                'parent_id' => $this->labelRoot()->id,
                'label_tree_id' => $this->labelTree()->id,
            ]);
        }

        return $this->labelChild;
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
