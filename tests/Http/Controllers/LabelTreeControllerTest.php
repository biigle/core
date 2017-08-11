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
        $response = $this->get("label-trees/{$tree->id}");
        $response->assertRedirect('login');

        $this->be($user);
        $response = $this->get("label-trees/{$tree->id}");
        $response->assertStatus(200);

        $response = $this->get("label-trees/{$privateTree->id}");
        $response->assertStatus(403);

        // doesn't exist
        $response = $this->get('label-trees/-1');
        $response->assertStatus(404);
    }

    public function testAdmin()
    {
        $this->get('admin/label-trees')->assertRedirect('login');
        $user = UserTest::create();
        $this->be($user);
        $response = $this->get('admin/label-trees')->assertStatus(403);
        $user->role()->associate(Role::$admin);
        $this->get('admin/label-trees')->assertStatus(200);
    }

    public function testIndex()
    {
        $user = UserTest::create();
        $this->get('label-trees')->assertRedirect('login');
        $this->be($user);
        $this->get('label-trees')->assertRedirect('search?t=label-trees');
    }

    public function testCreate()
    {
        $this->get('label-trees/create')->assertRedirect('login');
        $user = UserTest::create();
        $this->be($user);
        $this->get('label-trees/create')->assertStatus(200);

        $project = ProjectTest::create();
        $response = $this->get('label-trees/create?project='.$project->id);
        $response->assertStatus(403);

        $this->be($project->creator);
        $response = $this->get('label-trees/create?project='.$project->id);
        $response->assertStatus(200);

        $response = $this->get('label-trees/create?project=999');
        $response->assertStatus(404);
    }
}
