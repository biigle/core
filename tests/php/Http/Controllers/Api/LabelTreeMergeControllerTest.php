<?php

namespace Biigle\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Role;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoLabelTest;

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

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$existingChild->id],
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'bada55',
                        'parent_id' => $existingParent->id,
                        'children' => [
                            [
                                'name' => 'New Child',
                                'color' => 'c0ffee',
                            ],
                        ],
                    ],
                    [
                        'name' => 'New Label2',
                        'color' => 'bada55',
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
        $exists = $tree->labels()
            ->where('name', 'New Label2')
            ->where('color', 'bada55')
            ->whereNull('parent_id')
            ->exists();
        $this->assertTrue($exists);
    }

    public function testStoreValidateParentIds()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $sameParent = LabelTest::create(['label_tree_id' => $tree->id]);
        $otherParent = LabelTest::create();

        $this->beEditor();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
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

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'bada55',
                        'parent_id' => 'anemone',
                    ],
                ],
            ])
            // Parent is no ID.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'bada55',
                        'parent_id' => $otherParent->id,
                    ],
                ],
            ])
            // Parent belongs to other tree.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'bada55',
                        'parent_id' => $sameParent->id,
                    ],
                ],
            ])
            ->assertStatus(200);
    }

    public function testStoreValidateCreateProperties()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $sameParent = LabelTest::create(['label_tree_id' => $tree->id]);

        $this->beEditor();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'create' => [
                    [
                        'name' => 'New Label',
                    ],
                ],
            ])
            // Color is required.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'create' => [
                    [
                        'color' => 'bada55',
                    ],
                ],
            ])
            // Name is required.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'badaxx',
                    ],
                ],
            ])
            // Color is invalid.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'bada55',
                        'children' => [
                            [
                                'name' => 'New Child',
                            ],
                        ],
                    ],
                ],
            ])
            // Child is invalid.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'bada55',
                        'children' => [
                            [
                                'name' => 'New Child',
                                'color' => 'c0ffee',
                                'parent_id' => $sameParent->id,
                            ],
                        ],
                    ],
                ],
            ])
            // Child may not have a parent ID.
            ->assertStatus(422);
    }

    public function testStoreRemoveIdsExist()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $otherTree = LabelTest::create();

        $this->beEditor();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [999],
            ])
            // Does not exist.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$otherTree->id],
            ])
            // Belongs to other tree.
            ->assertStatus(422);
    }

    public function testStoreRemoveIdsCanBeDeletedImageAnnotationLabel()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $label = LabelTest::create(['label_tree_id' => $tree->id]);
        $annotationLabel = ImageAnnotationLabelTest::create(['label_id' => $label->id]);

        $this->beEditor();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id],
            ])
            // Cannot be removed.
            ->assertStatus(422);

        $annotationLabel->delete();
        $child = LabelTest::create([
            'label_tree_id' => $tree->id,
            'parent_id' => $label->id,
        ]);

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id],
            ])
            // Still cannot be removed.
            ->assertStatus(422);

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id, $child->id],
            ])
            ->assertStatus(200);
    }

    public function testStoreRemoveIdsCanBeDeletedImageLabel()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $label = LabelTest::create(['label_tree_id' => $tree->id]);
        $annotationLabel = ImageLabelTest::create(['label_id' => $label->id]);

        $this->beEditor();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id],
            ])
            // Cannot be removed.
            ->assertStatus(422);

        $annotationLabel->delete();

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id],
            ])
            ->assertStatus(200);
    }

    public function testStoreRemoveIdsCanBeDeletedVideoAnnotationLabel()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $label = LabelTest::create(['label_tree_id' => $tree->id]);
        $annotationLabel = VideoAnnotationLabelTest::create(['label_id' => $label->id]);

        $this->beEditor();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id],
            ])
            // Cannot be removed.
            ->assertStatus(422);

        $annotationLabel->delete();

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id],
            ])
            ->assertStatus(200);
    }

    public function testStoreRemoveIdsCanBeDeletedVideoLabel()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $label = LabelTest::create(['label_tree_id' => $tree->id]);
        $annotationLabel = VideoLabelTest::create(['label_id' => $label->id]);

        $this->beEditor();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id],
            ])
            // Cannot be removed.
            ->assertStatus(422);

        $annotationLabel->delete();

        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id],
            ])
            ->assertStatus(200);
    }

    public function testStoreRemoveIdsAreNotUsedInCreate()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $label = LabelTest::create(['label_tree_id' => $tree->id]);

        $this->beEditor();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/merge-labels", [
                'remove' => [$label->id],
                'create' => [
                    [
                        'name' => 'New Label',
                        'color' => 'bada55',
                        'parent_id' => $label->id,
                    ],
                ],
            ])
            // Label to removed is used as parent in create.
            ->assertStatus(422);
    }
}
