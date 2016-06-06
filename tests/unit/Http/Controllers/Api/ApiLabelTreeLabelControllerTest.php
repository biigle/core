<?php

use Dias\Role;
use Dias\LabelTree;

class ApiLabelTreeLabelControllerTest extends ApiTestCase
{

    public function testStore()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::$editor);
        $parent = LabelTest::create(['label_tree_id' => $tree->id]);
        $otherLabel = LabelTest::create();

        $this->doTestApiRoute('POST', "/api/v1/label-trees/{$tree->id}/labels");

        $this->beUser();
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels");
        // missing arguments
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
        ]);
        // missing color
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'color' => 'bada55',
        ]);
        // missing name
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'parent_id' => $otherLabel->id,
        ]);
        // parent is not from same tree
        $this->assertResponseStatus(422);

        $this->assertEquals(1, $tree->labels()->count());
        $this->assertFalse($parent->children()->exists());
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'parent_id' => $parent->id,
        ]);
        $this->assertResponseOk();
        $this->assertEquals(2, $tree->labels()->count());
        $this->assertTrue($parent->children()->exists());

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label 2',
            'color' => 'bada55',
            'aphia_id' => 1234,
        ]);
        $this->assertResponseOk();
        $this->assertEquals(3, $tree->labels()->count());

        $expect = [
            'id' => $tree->labels()->max('id'),
            'name' => 'new label 2',
            'color' => 'bada55',
            'parent_id' => null,
            'aphia_id' => 1234,
            'label_tree_id' => $tree->id,
        ];

        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            $expect['id'] = (int) $expect['id'];
            $expect['label_tree_id'] = (string) $expect['label_tree_id'];
        }

        $this->seeJsonEquals($expect);
    }

    public function testStoreFormRequest()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::$editor);
        $this->beEditor();
        $this->visit('/');
        $this->post("/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
        ]);
        $this->assertEquals(1, $tree->labels()->count());
        $this->assertRedirectedTo('/');
        $this->assertSessionHas('saved', true);

        $this->post("/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            '_redirect' => 'settings',
        ]);
        $this->assertEquals(2, $tree->labels()->count());
        $this->assertRedirectedTo('/settings');
        $this->assertSessionHas('saved', true);
    }
}
