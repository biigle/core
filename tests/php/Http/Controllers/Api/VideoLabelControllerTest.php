<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;

class VideoLabelControllerTest extends ApiTestCase
{
    private $video;

    public function setUp(): void
    {
        parent::setUp();
        $this->video = VideoTest::create(['volume_id' => $this->volume()->id]);
    }

    public function testIndex()
    {
        $id = $this->video->id;
        $il = VideoLabelTest::create(['video_id' => $this->video->id]);

        $this->doTestApiRoute('GET', "/api/v1/videos/{$id}/labels");

        $this->beUser();
        $this->get("/api/v1/videos/{$id}/labels")->assertStatus(403);

        $this->beGuest();
        $this
            ->get("/api/v1/videos/{$id}/labels")
            ->assertStatus(200)
            ->assertJsonFragment([
                'id' => $il->label->id,
                'name' => $il->label->name,
                'parent_id' => $il->label->parent_id,
                'color' => $il->label->color,
            ])
            ->assertJsonFragment([
                'id' => $il->user->id,
                'firstname' => $il->user->firstname,
                'lastname' => $il->user->lastname,
            ]);
    }

    public function testStore()
    {
        $id = $this->video->id;
        $this->doTestApiRoute('POST', "/api/v1/videos/{$id}/labels");

        // missing arguments
        $this->beEditor();
        $this
            ->postJson("/api/v1/videos/{$id}/labels")->assertStatus(422);

        $this->assertSame(0, $this->video->labels()->count());

        $this->beUser();
        $this
            ->post("/api/v1/videos/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertStatus(403);

        $this->beGuest();
        $this
            ->post("/api/v1/videos/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertStatus(403);

        $this->beEditor();
        $this
            ->post("/api/v1/videos/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertSuccessful();
        $this->assertSame(1, $this->video->labels()->count());

        $this->beAdmin();
        // the same label cannot be attached twice
        $this
            ->post("/api/v1/videos/{$id}/labels", [
                'label_id' => $this->labelRoot()->id,
            ])
            ->assertStatus(400);
        $this->assertSame(1, $this->video->labels()->count());

        $this
            ->postJson("/api/v1/videos/{$id}/labels", [
                'label_id' => $this->labelChild()->id,
            ])
            ->assertSuccessful()
            ->assertJsonFragment([
                'id' => $this->labelChild()->id,
                'name' => $this->labelChild()->name,
                'color' => $this->labelChild()->color,
            ])
            ->assertJsonFragment([
                'id' => $this->admin()->id,
                'firstname' => $this->admin()->firstname,
                'lastname' => $this->admin()->lastname,
                'role_id' => $this->admin()->role_id,
            ]);
        $this->assertSame(2, $this->video->labels()->count());
    }

    public function testDestroy()
    {
        $id = VideoLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'video_id' => $this->video->id,
            'user_id' => $this->editor()->id,
        ])->id;

        $id2 = VideoLabelTest::create([
            'label_id' => $this->labelRoot()->id,
            'video_id' => $this->video->id,
            'user_id' => $this->admin()->id,
        ])->id;

        $this->doTestApiRoute('DELETE', "/api/v1/video-labels/{$id}");

        $this->beUser();
        $this->delete("/api/v1/video-labels/{$id}")->assertStatus(403);

        $this->beGuest();
        $this->delete("/api/v1/video-labels/{$id}")->assertStatus(403);

        $this->assertTrue($this->video->labels()->where('id', $id)->exists());
        $this->beEditor();
        $this->delete("/api/v1/video-labels/{$id}")->assertStatus(200);
        $this->assertFalse($this->video->labels()->where('id', $id)->exists());

        // not the own label
        $this->delete("/api/v1/video-labels/{$id2}")->assertStatus(403);

        $this->assertTrue($this->video->labels()->where('id', $id2)->exists());

        $id = VideoLabelTest::create([
            'label_id' => $this->labelChild()->id,
            'video_id' => $this->video->id,
            'user_id' => $this->editor()->id,
        ])->id;
        $this->assertTrue($this->video->labels()->where('id', $id)->exists());

        $this->beAdmin();
        $this->delete("/api/v1/video-labels/{$id}")->assertStatus(200);
        $this->assertFalse($this->video->labels()->where('id', $id)->exists());

        $this->delete("/api/v1/video-labels/{$id2}")->assertStatus(200);
        $this->assertFalse($this->video->labels()->exists());
    }
}
