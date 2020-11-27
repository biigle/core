<?php

namespace Biigle\Http\Controllers\Views\LabelTrees;

use Biigle\Role;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\UserTest;
use Biigle\Visibility;
use Cache;
use TestCase;

class LabelTreeMembersControllerTest extends TestCase
{
    public function testShow()
    {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::publicId()]);
        $user = UserTest::create();

        $this->get("label-trees/{$tree->id}/members")
            ->assertRedirect('login');

        $this->be($user);
        $this->get("label-trees/{$tree->id}/members")
            ->assertStatus(403);

        Cache::flush();

        $tree->addMember($user, Role::editor());
        $this->get("label-trees/{$tree->id}/members")
            ->assertStatus(403);

        Cache::flush();

        $tree->updateMember($user, Role::admin());
        $this->get("label-trees/{$tree->id}/members")
            ->assertStatus(200);
    }

    public function testShowVersions()
    {
        $version = LabelTreeVersionTest::create();
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $user = UserTest::create();
        $this->be($user);
        $this->get("label-trees/{$tree->id}/members")->assertStatus(404);
    }
}
