<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Role;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;

class LabelControllerTest extends ApiTestCase
{
    public function testUpdate()
    {
        $tree = LabelTreeTest::create();
        $otherLabel = LabelTest::create();
        $label = LabelTest::create([
            'name' => 'label name',
            'color' => 'abcdef',
            'parent_id' => null,
            'label_tree_id' => $tree->id,
        ]);
        $sibling = LabelTest::create(['label_tree_id' => $tree->id]);
        $tree->addMember($this->editor(), Role::editor());

        $this->doTestApiRoute('PUT', "/api/v1/labels/{$label->id}");

        // only label tree members can edit a label
        $this->beUser();
        $response = $this->json('PUT', "/api/v1/labels/{$label->id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('PUT', "/api/v1/labels/{$label->id}", [
            'name' => '',
        ]);
        // name must be filled
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/labels/{$label->id}", [
            'color' => '',
        ]);
        // color must be filled
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/labels/{$label->id}", [
            'parent_id' => $otherLabel->id,
        ]);
        // parent is not from same tree
        $response->assertStatus(422);

        $response = $this->json('PUT', "/api/v1/labels/{$label->id}", [
            'name' => 'new label name',
            'color' => 'bada55',
            'parent_id' => $sibling->id,
        ]);
        $response->assertStatus(200);

        $label = $label->fresh();
        $this->assertSame('new label name', $label->name);
        $this->assertSame('bada55', $label->color);
        $this->assertSame($sibling->id, $label->parent_id);
    }

    public function testUpdateVersionedTree()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->editor(), Role::editor());
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $label = LabelTest::create(['label_tree_id' => $tree->id]);
        $this->beEditor();
        $this->putJson("/api/v1/labels/{$label->id}", ['name' => 'new name'])
            ->assertStatus(403);
    }

    public function testDestroy()
    {
        $label = LabelTest::create();
        $label->tree->addMember($this->editor(), Role::editor());

        $this->doTestApiRoute('DELETE', "/api/v1/labels/{$label->id}");

        // only label tree members can remove a label
        $this->beUser();
        $response = $this->json('DELETE', "/api/v1/labels/{$label->id}");
        $response->assertStatus(403);

        // make sure the label is used somewhere
        $a = ImageAnnotationLabelTest::create(['label_id' => $label->id]);

        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/labels/{$label->id}");
        // can't be deleted if a label is still in use
        $response->assertStatus(403);

        $a->delete();

        $child = LabelTest::create(['parent_id' => $label->id]);

        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/labels/{$label->id}");
        // can't be deleted if label has children
        $response->assertStatus(403);

        $child->delete();

        $this->assertNotNull($label->fresh());
        $response = $this->json('DELETE', "/api/v1/labels/{$label->id}");
        $response->assertStatus(200);
        $this->assertNull($label->fresh());
    }

    public function testDestroyFormRequest()
    {
        $label = LabelTest::create();
        $label->tree->addMember($this->editor(), Role::editor());

        $this->beEditor();
        $this->get('/');
        $response = $this->delete("/api/v1/labels/{$label->id}");
        $this->assertNull($label->fresh());
        $response->assertRedirect('/');
        $response->assertSessionHas('deleted', true);

        $label = LabelTest::create();
        $label->tree->addMember($this->editor(), Role::editor());

        $response = $this->delete("/api/v1/labels/{$label->id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertNull($label->fresh());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('deleted', true);
    }

    public function testDestroyVersionedTree()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->editor(), Role::editor());
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $label = LabelTest::create(['label_tree_id' => $tree->id]);
        $this->beEditor();
        $this->deleteJson("/api/v1/labels/{$label->id}", ['name' => 'new name'])
            ->assertStatus(403);
    }
}
