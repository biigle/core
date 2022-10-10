<?php

namespace Biigle\Http\Controllers\Views\LabelTrees;

use Biigle\Role;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\Visibility;
use Cache;
use TestCase;

class LabelTreeControllerTest extends TestCase
{
    public function testShow()
    {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::publicId()]);
        $user = UserTest::create();

        $privateTree = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);

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

    public function testShowVersions()
    {
        $version = LabelTreeVersionTest::create();
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $user = UserTest::create();
        $this->be($user);
        $this->get("label-trees/{$tree->id}")->assertStatus(200);
    }

    public function testAdmin()
    {
        $this->get('admin/label-trees')->assertRedirect('login');
        $user = UserTest::create();
        $this->be($user);
        $response = $this->get('admin/label-trees')->assertStatus(403);
        $user->role()->associate(Role::admin());
        $this->get('admin/label-trees')->assertStatus(200);
    }

    public function testAdminNoVersions()
    {
        $version = LabelTreeVersionTest::create();
        $tree = LabelTreeTest::create([
            'name' => 'version tree',
            'version_id' => $version->id,
        ]);
        $user = UserTest::create();
        $user->role()->associate(Role::admin());
        $this->be($user);
        $this->get('admin/label-trees')
            ->assertStatus(200)
            ->assertDontSeeText('version tree');
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
        $user = UserTest::create(['role_id' => Role::guestId()]);
        $this->be($user);
        $this->get('label-trees/create')->assertStatus(403);

        $user->role_id = Role::editorId();
        $user->save();
        $this->get('label-trees/create')->assertStatus(200);

        $project = ProjectTest::create();
        $response = $this->get('label-trees/create?project='.$project->id);
        $response->assertStatus(403);

        $this->be($project->creator);
        $response = $this->get('label-trees/create?project='.$project->id);
        $response->assertStatus(200);

        $response = $this->get('label-trees/create?project=-1');
        $response->assertStatus(404);
    }

    public function testCreateProject()
    {
        $user = UserTest::create(['role_id' => Role::editorId()]);
        $this->be($user);
        $project = ProjectTest::create();
        $response = $this->get('label-trees/create?project='.$project->id);
        $response->assertStatus(403);

        $this->be($project->creator);
        $response = $this->get('label-trees/create?project='.$project->id);
        $response->assertStatus(200);

        $response = $this->get('label-trees/create?project=-1');
        $response->assertStatus(404);
    }

    public function testCreateFork()
    {
        $user = UserTest::create(['role_id' => Role::editorId()]);
        $this->be($user);
        $labelTree = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);
        $response = $this->get('label-trees/create?upstream_label_tree='.$labelTree->id);
        $response->assertStatus(403);

        $labelTree->addMember($user, Role::editor());
        Cache::clear();
        $response = $this->get('label-trees/create?upstream_label_tree='.$labelTree->id);
        $response->assertStatus(200);

        $response = $this->get('label-trees/create?upstream_label_tree=-1');
        $response->assertStatus(404);
    }
}
