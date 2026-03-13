<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\AnnotationStrategy;
use Biigle\AnnotationStrategyLabel;
use Biigle\Shape;
use Biigle\Label;
use Storage;

class AnnotationStrategyControllerTest extends ApiTestCase {
    public function testIndex() {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-strategy";
        $this->doTestApiRoute('GET', $path);

        $this->beGuest();
        $this->get($path)
            ->assertStatus(403);

        $this->beUser();
        $this->get($path)
            ->assertStatus(403);

        $this->beEditor();
        $this->get($path)
            ->assertStatus(403);

        $this->beAdmin();
        $this->get($path)
            ->assertStatus(404);

        $as1 = AnnotationStrategy::create(['project' => $id, 'description' => 'someDescription']);

        $this->get($path)
            ->assertStatus(200)
            ->assertExactJson(
                [
                    'annotation_strategy' =>
                        ['id' => $as1->id, 'project' => $id, 'description' => 'someDescription'],
                    'annotation_strategy_labels' => [],
                ]
            );
        $label = Label::factory()->create();

        $asl1 = AnnotationStrategyLabel::create(
            [
                'annotation_strategy' => $as1->id,
                'label' => $label->id,
                'shape' => Shape::polygonId(),
                'description' => 'labelDescription',
                'reference_image' => 'file.jpg',
            ]);

        $this->get($path)
            ->assertStatus(200)
            ->assertJson(
                [
                    'annotation_strategy' =>
                        ['id' => $as1->id, 'project' => $id, 'description' => 'someDescription'],
                    'annotation_strategy_labels' => [[
                        'description' => 'labelDescription',
                        'label' => $label->toArray(),
                        'reference_image' => 'file.jpg',
                        'shape' => Shape::polygonId(),
                    ]],
                ]
            );
    }
    public function testUpdate()
    {
        $id = $this->project()->id;
        $path = "/api/v1/projects/{$id}/annotation-strategy";
        $this->doTestApiRoute('POST', $path);

        $data = ['description' => 'someDescription'];

        $this->beGuest();
        $this->json('POST', $path, $data)
            ->assertStatus(403);

        $this->beUser();
        $this->json('POST', $path, $data)
            ->assertStatus(403);

        $this->beEditor();
        $this->json('POST', $path, $data)
            ->assertStatus(403);

        $this->beAdmin();
        $this->json('POST', $path, $data)
            ->assertStatus(200);

        $as1 = AnnotationStrategy::where(['project' => $id])->first();

        $this->assertSame($as1->project, $id);
        $this->assertSame($as1->description, 'someDescription');

        $this->json('POST', $path, ['project' => $id, 'description' => 'someNewDescription'])
            ->assertStatus(200);

        $as2 = AnnotationStrategy::where(['project' => $id])->first();

        $this->assertSame($as2->id, $as1->id);
        $this->assertSame($as2->project, $id);
        $this->assertSame($as2->description, 'someNewDescription');
    }

    public function testDelete()
    {
        $id = $this->project()->id;
        config(['annotation_strategy.storage_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $path = "/api/v1/projects/{$id}/annotation-strategy";
        $this->doTestApiRoute('DELETE', $path);

        $this->beGuest();
        $this->delete($path)
            ->assertStatus(403);

        $this->beUser();
        $this->delete($path)
            ->assertStatus(403);

        $this->beEditor();
        $this->delete($path)
            ->assertStatus(403);

        $this->beAdmin();
        $this->delete($path)
            ->assertStatus(404);

        AnnotationStrategy::create(['project' => $id, 'description' => 'someDescription']);

        //We also test that the files are cleared
        $disk->put("$id/somefile.png", 'content');

        $this->delete($path)
            ->assertStatus(200);

        $this->assertEmpty(AnnotationStrategy::where(['project' => $id])->first());
        $disk->assertMissing("$id/somefile.png");
    }
}
