<?php

namespace Biigle\Tests\Http\Controllers\Api;

use File;
use Event;
use Cache;
use Biigle\Role;
use Biigle\Image;
use ApiTestCase;
use Biigle\Volume;
use Biigle\MediaType;
use Biigle\Visibility;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Tests\ImageLabelTest;

class ProjectVolumeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;
        // Create volume.
        $this->volume();
        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/volumes");

        $this->beUser();
        $response = $this->get("/api/v1/projects/{$id}/volumes");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/projects/{$id}/volumes");
        $content = $response->getContent();
        $response->assertStatus(200);
        // response should not be an empty array
        $this->assertStringStartsWith('[{', $content);
        $this->assertStringEndsWith('}]', $content);
        $this->assertNotContains('pivot', $content);
    }

    public function testStore()
    {
        $this->markTestIncomplete('Implement volume_authorized_project');
        $tid = $this->volume()->id;

        $secondProject = ProjectTest::create();
        $pid = $secondProject->id;

        $this->doTestApiRoute('POST', "/api/v1/projects/{$pid}/volumes/{$tid}");

        $this->beAdmin();
        $response = $this->post("/api/v1/projects/{$pid}/volumes/{$tid}");
        $response->assertStatus(403);

        $secondProject->addUserId($this->admin()->id, Role::$admin->id);
        Cache::flush();

        $this->assertEmpty($secondProject->fresh()->volumes);
        $response = $this->post("/api/v1/projects/{$pid}/volumes/{$tid}");
        $response->assertStatus(200);
        $this->assertNotEmpty($secondProject->fresh()->volumes);
    }

    public function testStoreDuplicate()
    {
        $this->markTestIncomplete('Implement volume_authorized_project');
        $tid = $this->volume()->id;
        $pid = $this->project()->id;

        $this->beAdmin();
        $response = $this->json('POST', "/api/v1/projects/{$pid}/volumes/{$tid}");
        $response->assertStatus(422);
    }

    public function testDestroy()
    {
        $pid = $this->project()->id;
        $id = $this->volume()->id;

        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$pid}/volumes/{$id}");

        $this->beUser();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $otherVolume = VolumeTest::create();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$otherVolume->id}");
        // Does not belong to the project.
        $response->assertStatus(404);

        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(200);

        $this->assertNotNull($this->volume()->fresh());
        $this->assertFalse($this->project()->volumes()->exists());
    }

    public function testDestroyForceAnnotations()
    {
        $pid = $this->project()->id;
        $id = $this->volume()->id;
        $annotation = AnnotationTest::create([
            'project_volume_id' => $this->projectVolume()->id,
        ]);

        $this->beAdmin();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(400);

        Event::fake();

        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}", [
            'force' => 'abc',
        ]);
        $response->assertStatus(200);
        $this->assertNotNull($this->volume()->fresh());
        $this->assertFalse($this->project()->volumes()->exists());
        $this->assertNull($annotation->fresh());
        Event::assertDispatched('annotations.cleanup', function ($e, $arg) use ($annotation) {
            return $arg[0] === $annotation->id;
        });
    }

    public function testDestroyForceImageLabels()
    {
        $pid = $this->project()->id;
        $id = $this->volume()->id;
        $imageLabel = ImageLabelTest::create([
            'project_volume_id' => $this->projectVolume()->id,
        ]);

        $this->beAdmin();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}");
        $response->assertStatus(400);

        Event::fake();
        $response = $this->delete("/api/v1/projects/{$pid}/volumes/{$id}", [
            'force' => 'abc',
        ]);
        $response->assertStatus(200);
        $this->assertNotNull($this->volume()->fresh());
        $this->assertFalse($this->project()->volumes()->exists());
        $this->assertNull($imageLabel->fresh());
        Event::assertNotDispatched('annotations.cleanup');
    }
}
