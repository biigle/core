<?php

namespace Biigle\Tests\Http\Controllers\Api;

use App;
use Mockery;
use Biigle\Role;
use ApiTestCase;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelSourceTest;
use Illuminate\Validation\ValidationException;

class LabelTreeLabelControllerTest extends ApiTestCase
{
    public function testStoreNormal()
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
        ]);
        $this->assertResponseOk();
        $this->assertEquals(3, $tree->labels()->count());

        $expect = [
            'id' => (int) $tree->labels()->max('id'),
            'name' => 'new label 2',
            'color' => 'bada55',
            'parent_id' => null,
            'label_tree_id' => $tree->id,
        ];

        $this->seeJsonEquals([$expect]);
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

    public function testStoreLabelSource()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::$editor);

        $this->beEditor();
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'label_source_id' => 1,
        ]);
        // label source does not exist
        $this->assertResponseStatus(422);

        $source = LabelSourceTest::create(['name' => 'my_source']);

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'label_source_id' => $source->id,
        ]);
        // source_id not given
        $this->assertResponseStatus(422);

        $mock = Mockery::mock();

        $labels = collect([LabelTest::create()])->toArray();

        $mock->shouldReceive('create')
            ->once()
            ->andReturn($labels);

        App::singleton('Biigle\Services\LabelSourceAdapters\MySourceAdapter', function () use ($mock) {
            return $mock;
        });

        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'label_source_id' => $source->id,
            'source_id' => 'affbbaa00123',
        ]);
        $this->assertResponseOk();
        $this->seeJsonEquals($labels);
    }

    public function testStoreLabelSourceError()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::$editor);
        $source = LabelSourceTest::create(['name' => 'my_source']);

        $mock = Mockery::mock();

        $exception = new ValidationException(null, ['my_field' => ['Invalid.']]);
        $mock->shouldReceive('create')
            ->once()
            ->andThrow($exception);

        App::singleton('Biigle\Services\LabelSourceAdapters\MySourceAdapter', function () use ($mock) {
            return $mock;
        });

        $this->beEditor();
        $this->json('POST', "/api/v1/label-trees/{$tree->id}/labels", [
            'name' => 'new label',
            'color' => 'bada55',
            'label_source_id' => $source->id,
            'source_id' => 'affbbaa00123',
        ]);
        $this->assertResponseStatus(422);
        $this->seeJsonEquals(['my_field' => ['Invalid.']]);
    }
}
