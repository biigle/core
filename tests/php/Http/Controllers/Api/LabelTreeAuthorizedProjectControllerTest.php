<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Enums\Role;
use Biigle\Enums\Visibility;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\LabelTreeVersionTest;
use Storage;

class LabelTreeAuthorizedProjectControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->editor(), Role::EDITOR);
        $tree->addMember($this->admin(), Role::ADMIN);

        $this->doTestApiRoute('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");

        $this->beUser();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");
        $response->assertStatus(403);

        $this->beAdmin();

        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects");
        // project id is required
        $response->assertStatus(422);

        $this->assertFalse($tree->authorizedProjects()->exists());
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
        ]);
        $response->assertStatus(200);
        $this->assertTrue($tree->authorizedProjects()->exists());

        $this->assertSame(1, $tree->authorizedProjects()->count());
        $response = $this->json('POST', "/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
        ]);
        // should not fail if same project is authorized twice but should not add it twice
        $response->assertStatus(200);
        $this->assertSame(1, $tree->authorizedProjects()->count());
    }

    public function testStoreFormRequest()
    {
        $tree = LabelTreeTest::create();
        $tree->addMember($this->admin(), Role::ADMIN);
        $this->beAdmin();
        $this->get('/');
        $response = $this->post("/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
        ]);
        $this->assertSame(1, $tree->authorizedProjects()->count());
        $response->assertRedirect('/');
        $response->assertSessionHas('saved', true);

        $response = $this->post("/api/v1/label-trees/{$tree->id}/authorized-projects", [
            'id' => $this->project()->id,
            '_redirect' => 'settings',
        ]);
        $this->assertSame(1, $tree->authorizedProjects()->count());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('saved', true);
    }

    public function testStoreVersions()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::ADMIN);
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $this->beAdmin();
        $this
            ->postJson("/api/v1/label-trees/{$tree->id}/authorized-projects", [
                'id' => $this->project()->id,
            ])
            ->assertStatus(403);
    }

    public function testStorePropagateVersions()
    {
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::ADMIN);
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $this->beAdmin();
        $this
            ->postJson("/api/v1/label-trees/{$version->labelTree->id}/authorized-projects", [
                'id' => $this->project()->id,
            ])
            ->assertStatus(200);
        $this->assertNotNull($tree->authorizedProjects()->find($this->project()->id));
    }

    public function testDestroy()
    {
        $project = $this->project();
        $tree = LabelTreeTest::create(['visibility' => Visibility::PUBLIC]);
        $tree->addMember($this->editor(), Role::EDITOR);
        $tree->addMember($this->admin(), Role::ADMIN);
        $tree->authorizedProjects()->attach($project->id);
        $tree->projects()->attach($project->id);

        $this->doTestApiRoute('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");

        $this->beUser();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        // not a member
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        // not admin
        $response->assertStatus(403);

        $this->beAdmin();
        $this->assertSame(1, $tree->authorizedProjects()->count());
        $this->assertSame(1, $tree->projects()->count());
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        $response->assertStatus(200);
        $this->assertSame(0, $tree->authorizedProjects()->count());
        $this->assertSame(1, $tree->projects()->count());

        $tree->authorizedProjects()->attach($project->id);
        $tree->visibility = Visibility::PRIVATE;
        $tree->save();

        $this->assertSame(1, $tree->authorizedProjects()->count());
        $this->assertSame(1, $tree->projects()->count());
        $response = $this->json('DELETE', "/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        // if the tree is private and project authorization is removed, the
        // tree should be removed from the project as well
        $response->assertStatus(200);
        $this->assertSame(0, $tree->authorizedProjects()->count());
        $this->assertSame(0, $tree->projects()->count());
    }

    public function testDestroyPrivateDeletesGuidelineLabels()
    {
        config(['projects.annotation_guideline_disk' => 'annotation_storage']);
        Storage::fake('annotation_storage');

        $project = $this->project();
        $tree = LabelTreeTest::create(['visibility' => Visibility::PRIVATE]);
        $tree->addMember($this->admin(), Role::ADMIN);
        $tree->authorizedProjects()->attach($project->id);
        $tree->projects()->attach($project->id);
        $label = LabelTest::create(['label_tree_id' => $tree->id]);

        $guideline = AnnotationGuideline::factory()->create([
            'project_id' => $project->id,
        ]);
        $guidelineLabel = AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $label->id,
            'reference_image_path' => "{$guideline->id}/image.jpg",
        ]);
        Storage::disk('annotation_storage')->put("{$guideline->id}/image.jpg", 'image');

        // Guideline labels of other projects must not be affected.
        $otherGuidelineLabel = AnnotationGuidelineLabel::factory()->create([
            'label_id' => $label->id,
        ]);

        $this->beAdmin();
        $this->deleteJson("/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}")
            ->assertStatus(200);

        $this->assertNull($guidelineLabel->fresh());
        $this->assertNotNull($otherGuidelineLabel->fresh());
        Storage::disk('annotation_storage')->assertMissing("{$guideline->id}/image.jpg");
    }

    public function testDestroyFormRequest()
    {
        $tree = LabelTreeTest::create(['visibility' => Visibility::PUBLIC]);
        $tree->addMember($this->admin(), Role::ADMIN);
        $project = $this->project();
        $tree->authorizedProjects()->attach($project->id);

        $this->beAdmin();
        $this->get('/');
        $response = $this->delete("/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}");
        $this->assertFalse($tree->authorizedProjects()->exists());
        $response->assertRedirect('/');
        $response->assertSessionHas('deleted', true);

        $tree->authorizedProjects()->attach($project->id);

        $response = $this->delete("/api/v1/label-trees/{$tree->id}/authorized-projects/{$project->id}", [
            '_redirect' => 'settings',
        ]);
        $this->assertFalse($tree->authorizedProjects()->exists());
        $response->assertRedirect('/settings');
        $response->assertSessionHas('deleted', true);
    }

    public function testDestroyVersions()
    {
        $id = $this->project()->id;
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::ADMIN);
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $tree->authorizedProjects()->attach($id);
        $this->beAdmin();
        $this->deleteJson("/api/v1/label-trees/{$tree->id}/authorized-projects/{$id}")
            ->assertStatus(403);
    }

    public function testDestroyPropagateVersions()
    {
        $id = $this->project()->id;
        $version = LabelTreeVersionTest::create();
        $version->labelTree->addMember($this->admin(), Role::ADMIN);
        $version->labelTree->authorizedProjects()->attach($id);
        $tree = LabelTreeTest::create(['version_id' => $version->id]);
        $tree->authorizedProjects()->attach($id);
        $this->beAdmin();
        $this->deleteJson("/api/v1/label-trees/{$version->labelTree->id}/authorized-projects/{$id}")
            ->assertStatus(200);
        $this->assertNull($tree->authorizedProjects()->find($id));
    }
}
