<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Role;
use Biigle\Shape;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ProjectTest;
use Illuminate\Support\Str;

class ImageLabelControllerTest extends ApiTestCase
{
    private $image;

    public function setUp(): void
    {
        parent::setUp();
        $this->image = ImageTest::create(['volume_id' => $this->volume()->id]);
    }

    public function testIndex()
    {
        $id = $this->image->id;
        $il = ImageLabelTest::create(['image_id' => $this->image->id]);

        $this->doTestApiRoute('GET', "/api/v1/images/{$id}/labels");

        $this->beUser();
        $response = $this->get("/api/v1/images/{$id}/labels");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/images/{$id}/labels");
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $il->label->id,
            'name' => $il->label->name,
            'parent_id' => $il->label->parent_id,
            'color' => $il->label->color,
        ]);

        $response->assertJsonFragment([
            'id' => $il->user->id,
            'firstname' => $il->user->firstname,
            'lastname' => $il->user->lastname,
        ]);
    }

    public function testStore()
    {
        $id = $this->image->id;
        $this->doTestApiRoute('POST', "/api/v1/images/{$id}/labels");

        // missing arguments
        $this->beEditor();
        $response = $this->json('POST', "/api/v1/images/{$id}/labels");
        $response->assertStatus(422);

        $response = $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => -1,
        ]);
        $response->assertStatus(422);

        $this->assertSame(0, $this->image->labels()->count());

        $this->beUser();
        $response = $this->post("/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->post("/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->post("/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $response->assertSuccessful();
        $this->assertSame(1, $this->image->labels()->count());

        $this->beAdmin();
        // the same label cannot be attached twice
        $response = $this->post("/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ]);
        $response->assertStatus(400);
        $this->assertSame(1, $this->image->labels()->count());

        $response = $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelChild()->id,
        ]);
        $response->assertSuccessful();
        $this->assertSame(2, $this->image->labels()->count());
        $response->assertJsonFragment([
            'id' => $this->labelChild()->id,
            'name' => $this->labelChild()->name,
            'color' => $this->labelChild()->color,
        ]);
        $response->assertJsonFragment([
            'id' => $this->admin()->id,
            'firstname' => $this->admin()->firstname,
            'lastname' => $this->admin()->lastname,
            'role_id' => $this->admin()->role_id,
        ]);
    }

    public function testStoreLabelIdTypeString()
    {
        $this->beEditor();
        $id = $this->image->id;
        $response = $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => Str::random(2)
        ]);
        $response->assertStatus(422);
    }

    public function testStoreGuidelineRequired()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);
        $id = $this->image->id;

        $this->beEditor();
        $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guideline_id');

        $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'guideline_id' => $guideline->id,
        ])
            ->assertSuccessful();
    }

    public function testStoreGuidelineOptional()
    {
        AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);
        // The editor can annotate in this project, too, and it has no guideline.
        $project = ProjectTest::create();
        $project->addVolumeId($this->volume()->id);
        $project->addUserId($this->editor()->id, Role::editorId());

        $this->beEditor();
        $this->json('POST', "/api/v1/images/{$this->image->id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ])
            ->assertSuccessful();
    }

    public function testStoreGuidelineNotExists()
    {
        $this->beEditor();
        $this->json('POST', "/api/v1/images/{$this->image->id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'guideline_id' => -1,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guideline_id');
    }

    public function testStoreGuidelineNotEnforced()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => false,
        ]);
        $id = $this->image->id;

        $this->beEditor();
        $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'guideline_id' => $guideline->id,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guideline_id');

        $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
        ])
            ->assertSuccessful();
    }

    public function testStoreGuidelineLabel()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
        ]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $this->labelRoot()->id,
        ]);
        $id = $this->image->id;

        $this->beEditor();
        $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelChild()->id,
            'guideline_id' => $guideline->id,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('label_id');

        $this->json('POST', "/api/v1/images/{$id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'guideline_id' => $guideline->id,
        ])
            ->assertSuccessful();
    }

    public function testStoreGuidelineIgnoreShapes()
    {
        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $this->project()->id,
            'enforced' => true,
            'only_shapes' => [Shape::circleId()],
        ]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $this->labelRoot()->id,
            'shape_id' => Shape::circleId(),
        ]);

        $this->beEditor();
        $this->json('POST', "/api/v1/images/{$this->image->id}/labels", [
            'label_id' => $this->labelRoot()->id,
            'guideline_id' => $guideline->id,
        ])
            // File labels have no shape.
            ->assertSuccessful();
    }

    public function testDestroy()
    {
        $id = ImageLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'image_id' => $this->image->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $id2 = ImageLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'image_id' => $this->image->id,
            'user_id' => $this->admin()->id,
        ])->id;

        $this->doTestApiRoute('DELETE', '/api/v1/image-labels/'.$id);

        $this->beUser();
        $response = $this->delete('/api/v1/image-labels/'.$id);
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete('/api/v1/image-labels/'.$id);
        $response->assertStatus(403);

        $this->assertTrue($this->image->labels()->where('id', $id)->exists());
        $this->beEditor();
        $response = $this->delete('/api/v1/image-labels/'.$id);
        $response->assertStatus(200);
        $this->assertFalse($this->image->labels()->where('id', $id)->exists());

        $response = $this->delete('/api/v1/image-labels/'.$id2);
        // not the own label
        $response->assertStatus(403);

        $this->assertTrue($this->image->labels()->where('id', $id2)->exists());

        $id = ImageLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'image_id' => $this->image->id,
            'user_id' => $this->editor()->id,
        ])->id;
        $this->assertTrue($this->image->labels()->where('id', $id)->exists());

        $this->beAdmin();
        $response = $this->delete('/api/v1/image-labels/'.$id);
        $response->assertStatus(200);
        $this->assertFalse($this->image->labels()->where('id', $id)->exists());

        $response = $this->delete('/api/v1/image-labels/'.$id2);
        $response->assertStatus(200);
        $this->assertFalse($this->image->labels()->exists());
    }
}
