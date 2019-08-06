<?php

namespace Biigle\Tests\Modules\LabelTrees\Http\Api\Controllers;

use ApiTestCase;
use Biigle\Role;
use Biigle\Visibility;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;

class LabelTreeMergeControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $existingParent = LabelTest::create(['label_tree_id' => $tree->id]);
        $existingChild = LabelTest::create([
            'label_tree_id' => $tree->id,
            'parent_id' => $existingParent->id,
        ]);

        $this->doTestApiRoute('POST', "/api/v1/label-trees/{$tree->id}/merge-labels");

        $this->beUser();
        $this->postJson("/api/v1/label-trees/{$tree->id}/merge-labels")
            ->assertStatus(403);

        $this->beEditor();
        $this->postJson("/api/v1/label-trees/{$tree->id}/merge-labels")
            // Missing arguments.
            ->assertStatus(422);

        $this->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$existingChild->id],
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'bada55',
                        'parent_id' => $existingParent->id,
                        'children' => [
                            'name' => 'New Child',
                            'color' => 'c0ffee',
                        ],
                    ],
                ],
            ])
            ->assertStatus(200);

        $this->assertNull($existingChild->fresh());
        $label = $tree->labels()
            ->where('name', 'New Label')
            ->where('color', 'bada55')
            ->where('parent_id', $existingParent->id)
            ->first();
        $this->assertNotNull($label);
        $exists = $tree->labels()
            ->where('name', 'New Child')
            ->where('color', 'c0ffee')
            ->where('parent_id', $label->id)
            ->exists();
        $this->assertTrue($exists);
    }

    public function testStoreValidateCreateLabels()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $existingParent = LabelTest::create(['label_tree_id' => $tree->id]);

        $this->beEditor();
        $this->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [],
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'bada55',
                        'parent_id' => 999,
                    ],
                ],
            ])
            // Parent does not exist.
            ->assertStatus(422);
    }
}
