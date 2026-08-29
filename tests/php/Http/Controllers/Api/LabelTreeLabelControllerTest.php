<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use App;
use Biigle\Role;
use Biigle\Tests\LabelSourceTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Illuminate\Validation\ValidationException;
use Mockery;

class LabelTreeLabelControllerTest extends ApiTestCase
{
    public function testStoreNormal()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $parent = LabelTest::create(['label_tree_id' => $tree->id]);
        $otherLabel = LabelTest::create();

        $this->doTestApiRoute('POST', "/api/v1/label-trees/{$tree->id}/labels");

        $this->beUser();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels");
        // missing arguments
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
        ]);
        // missing color
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'color' => 'bada55',
        ]);
        // missing name
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'parent_id' => $otherLabel->id,
        ]);
        // parent is not from same tree
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'parent_id' => 'anemone',
        ]);
        // parent id must be integer
        $response->assertStatus(422);

        $this->assertSame(1, $tree->labels()->count());
        $this->assertFalse($parent->children()->exists());
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'parent_id' => $parent->id,
        ]);
        $response->assertStatus(200);
        $this->assertSame(2, $tree->labels()->count());
        $this->assertTrue($parent->children()->exists());

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label 2',
            'color' => 'bada55',
        ]);
        $response->assertStatus(200);
        $this->assertSame(3, $tree->labels()->count());

        $label = $tree->labels()->where('name', 'new label 2')->first();

        $expect = [
            'id' => $label->id,
            'name' => 'new label 2',
            'color' => 'bada55',
            'parent_id' => null,
            'label_tree_id' => $tree->id,
        ];

        $response->assertExactJson([$expect]);
        $this->assertNotNull($label->uuid);
    }

    public function testStoreFormRequest()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $this->beEditor();
        $this->get('/');
        $response = $this->post("/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
        ]);
        $this->assertSame(1, $tree->labels()->count());
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);

        $response = $this->post("/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            '_redirect' => 'settings',
        ]);
        $this->assertSame(2, $tree->labels()->count());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('saved', true);
    }

    public function testStoreLabelSource()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());

        $this->beEditor();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'label_source_id' => 1,
        ]);
        // label source does not exist
        $response->assertStatus(422);

        $source = LabelSourceTest::create(['name' => 'my_source']);

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'label_source_id' => $source->id,
        ]);
        // source_id not given
        $response->assertStatus(422);

        $mock = Mockery::mock();

        $labels = collect([LabelTest::create()])->toArray();

        $mock->shouldReceive('create')
            ->once()
            ->andReturn($labels);

        App::singleton('Biigle\Services\LabelSourceAdapters\MySourceAdapter', fn () => $mock);

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'label_source_id' => $source->id,
            'source_id' => 'affbbaa00123',
        ]);
        $response->assertStatus(200);
        $response->assertExactJson($labels);
    }

    public function testStoreLabelSourceError()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::editor());
        $source = LabelSourceTest::create(['name' => 'my_source']);

        $mock = Mockery::mock();

        $exception = ValidationException::withMessages(['my_field' => ['Invalid.']]);
        $mock->shouldReceive('create')
            ->once()
            ->andThrow($exception);

        App::singleton('Biigle\Services\LabelSourceAdapters\MySourceAdapter', fn () => $mock);

        $this->beEditor();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'label_source_id' => $source->id,
            'source_id' => 'affbbaa00123',
        ]);
        $response->assertStatus(422);
        $response->assertJsonFragment(['my_field' => ['Invalid.']]);
    }

    public function testStoreVersionedTree()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->editor(), Role::editor());
        $tree = LabelTreeTest::create(['version_id' => $version->id]);

        $this->beEditor();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/labels", [
                'name' => 'new label',
                'color' => 'bada55',
            ])
            ->assertStatus(403);
    }
}
