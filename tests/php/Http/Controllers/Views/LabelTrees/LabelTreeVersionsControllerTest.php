<?php

namespace Biigle\Http\Controllers\Views\LabelTrees;

use Biigle\Role;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Biigle\Tests\UserTest;
use Biigle\Visibility;
use TestCase;

class LabelTreeVersionsControllerTest extends TestCase
{
    public function testShow()
    {
        $user = UserTest::create();

        $publicVersion = LabelTreeVersionTest::create([
            'label_tree_id' => LabelTreeTest::create(['visibility_id' => Visibility::publicId()])->id,
        ]);
        $publicTree = LabelTreeTest::create([
            'visibility_id' => Visibility::publicId(),
            'version_id' => $publicVersion->id,
        ]);

        $privateVersion = LabelTreeVersionTest::create([
            'label_tree_id' => LabelTreeTest::create(['visibility_id' => Visibility::privateId()])->id,
        ]);
        $privateTree = LabelTreeTest::create([
            'visibility_id' => Visibility::privateId(),
            'version_id' => $privateVersion->id,
        ]);

        // Not logged in.
        $this->get("label-trees/{$publicVersion->label_tree_id}/versions/{$publicVersion->id}")
            ->assertRedirect('login');

        $this->be($user);
        $this->get("label-trees/{$publicVersion->label_tree_id}/versions/{$publicVersion->id}")
            ->assertRedirect("label-trees/{$publicTree->id}");

        $this->get("label-trees/{$privateVersion->label_tree_id}/versions/{$privateVersion->id}")
            ->assertStatus(403);

        $this->get("label-trees/{$publicVersion->label_tree_id}/versions/{$privateVersion->id}")
            ->assertStatus(404);

        $this->get("label-trees/{$privateVersion->label_tree_id}/versions/{$publicVersion->id}")
            ->assertStatus(404);

        $this->get("label-trees/{$publicVersion->label_tree_id}/versions/-1")
            ->assertStatus(404);
    }

    public function testCreate()
    {
        $tree = LabelTreeTest::create();
        $editor = UserTest::create();
        $tree->addMember($editor, Role::editorId());
        $admin = UserTest::create();
        $tree->addMember($admin, Role::adminId());

        $this->be($editor);
        $this->get("label-trees/{$tree->id}/versions/create")->assertStatus(403);

        $this->be($admin);
        $this->get("label-trees/{$tree->id}/versions/create")->assertStatus(200);

        $this->get("label-trees/-1/versions/create")->assertStatus(404);
    }
}
