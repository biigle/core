<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Project;
use Biigle\Tests\ProjectTest;

class UserPinnedProjectControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('GET', "/api/v1/projects/pinned");

        $this->beGuest();
        $this->getJson("/api/v1/projects/pinned")
            ->assertStatus(200)
            ->assertExactJson([]);

        $this->guest()->projects()->updateExistingPivot($id, ['pinned' => true]);

        $this->getJson("/api/v1/projects/pinned")
            ->assertStatus(200)
            ->assertExactJson([$this->project()->toArray()]);
    }

    public function testStore()
    {
        $id = $this->project()->id;
        $this->doTestApiRoute('POST', "/api/v1/projects/{$id}/pin");

        $this->beUser();
        $this->postJson("/api/v1/projects/{$id}/pin")->assertStatus(404);

        $this->beGlobalAdmin();
        $this->postJson("/api/v1/projects/{$id}/pin")->assertStatus(404);

        $hasPinned = $this->guest()->projects()->wherePivot('pinned', true)->exists();
        $this->assertFalse($hasPinned);

        $this->beGuest();
        $this->postJson("/api/v1/projects/{$id}/pin")->assertStatus(200);

        $hasPinned = $this->guest()->projects()->wherePivot('pinned', true)->exists();
        $this->assertTrue($hasPinned);

        $p2 = ProjectTest::create(['creator_id' => $this->guest()->id]);
        $this->guest()->projects()->updateExistingPivot($p2->id, ['pinned' => true]);
        $p3 = ProjectTest::create(['creator_id' => $this->guest()->id]);
        $this->guest()->projects()->updateExistingPivot($p3->id, ['pinned' => true]);
        $p4 = ProjectTest::create(['creator_id' => $this->guest()->id]);

        // Can't pin more than 3 projects.
        $this->postJson("/api/v1/projects/{$p4->id}/pin")->assertStatus(422);
        // If the project is already pinned, pass through.
        $this->postJson("/api/v1/projects/{$p2->id}/pin")->assertStatus(200);
    }

    public function testDestroy()
    {
        $id = $this->project()->id;
        $this->guest()->projects()->updateExistingPivot($id, ['pinned' => true]);
        $this->doTestApiRoute('DELETE', "/api/v1/projects/{$id}/pin");

        $this->beUser();
        $this->deleteJson("/api/v1/projects/{$id}/pin")->assertStatus(404);

        $this->beGlobalAdmin();
        $this->deleteJson("/api/v1/projects/{$id}/pin")->assertStatus(404);

        $hasPinned = $this->guest()->projects()->wherePivot('pinned', true)->exists();
        $this->assertTrue($hasPinned);

        $this->beGuest();
        $this->deleteJson("/api/v1/projects/{$id}/pin")->assertStatus(200);

        $hasPinned = $this->guest()->projects()->wherePivot('pinned', true)->exists();
        $this->assertFalse($hasPinned);
    }
}
