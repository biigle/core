<?php

namespace Biigle\Tests\Modules\LabelTrees\Http\Controllers;

use TestCase;
use Biigle\Role;
use Biigle\Visibility;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\LabelTreeTest;

class LabelTreeControllerTest extends TestCase
{
    public function testShow()
    {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::$public->id]);
        $user = UserTest::create();

        $privateTree = LabelTreeTest::create(['visibility_id' => Visibility::$private->id]);

        // not logged in
        $this->get("label-trees/{$tree->id}");
        $this->assertRedirectedTo('login');

        $this->be($user);
        $this->get("label-trees/{$tree->id}");
        $this->assertResponseOk();

        $this->get("label-trees/{$privateTree->id}");
        $this->assertResponseStatus(403);

        // doesn't exist
        $this->get('label-trees/-1');
        $this->assertResponseStatus(404);
    }

    public function testAdmin()
    {
        $this->visit('admin/label-trees')->seePageIs('login');
        $user = UserTest::create();
        $this->be($user);
        $this->get('admin/label-trees')->assertResponseStatus(403);
        $user->role()->associate(Role::$admin);
        $this->visit('admin/label-trees')->assertResponseOk();
    }

    public function testIndex()
    {
        $user = UserTest::create();
        $this->visit('label-trees')->seePageIs('login');
        $this->be($user);
        $this->visit('label-trees')->seePageIs('search?t=label-trees');
    }

    public function testCreate()
    {
        $this->visit('label-trees/create')->seePageIs('login');
        $user = UserTest::create();
        $this->be($user);
        $this->visit('label-trees/create')->assertResponseOk();

        $project = ProjectTest::create();
        $this->get('label-trees/create?project='.$project->id);
        $this->assertResponseStatus(403);

        $this->be($project->creator);
        $this->get('label-trees/create?project='.$project->id);
        $this->assertResponseOk();

        $this->get('label-trees/create?project=999');
        $this->assertResponseStatus(404);
    }
}
