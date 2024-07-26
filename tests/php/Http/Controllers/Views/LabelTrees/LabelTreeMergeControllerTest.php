<?php

namespace Biigle\Tests\Http\Controllers\Views\LabelTrees;

use Biigle\Role;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Visibility;
use Cache;
use TestCase;

class LabelTreeMergeControllerTest extends TestCase
{
    public function testIndex()
    {
        $baseTree = LabelTreeTest::create();
        $editor = UserTest::create();

        $this->be($editor);
        $this->get("label-trees/{$baseTree->id}/merge")
            ->assertStatus(403);
        $baseTree->addMember($editor, Role::editorId());
        Cache::flush();

        $this->get("label-trees/{$baseTree->id}/merge")
            ->assertStatus(200);
    }

    public function testShow()
    {
        $baseTree = LabelTreeTest::create();
        $mergeTree = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);
        $editor = UserTest::create();

        $this->be($editor);
        $this->get("label-trees/{$baseTree->id}/merge/{$mergeTree->id}")
            ->assertStatus(403);
        $baseTree->addMember($editor, Role::editorId());
        Cache::flush();

        $this->get("label-trees/{$baseTree->id}/merge/{$mergeTree->id}")
            ->assertStatus(403);
        $mergeTree->addMember($editor, Role::editorId());
        Cache::flush();

        $this->get("label-trees/{$baseTree->id}/merge/{$mergeTree->id}")
            ->assertStatus(200);
    }
}
