<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Api;

use Storage;
use ApiTestCase;
use Illuminate\Http\File;
use Biigle\Modules\Videos\Video;
use Biigle\Modules\Videos\Project;

class ProjectVideoControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->project()->id;
        $project = Project::find($id);
        $this->doTestApiRoute('POST', "/api/v1/projects/{$id}/videos");

        $this->beEditor();
        $this->post("/api/v1/projects/{$id}/videos")->assertStatus(403);

        $this->beAdmin();
        // mssing arguments
        $this->json('POST', "/api/v1/projects/{$id}/videos")->assertStatus(422);

        // invalid url format
        $this->json('POST', "/api/v1/projects/{$id}/videos", [
                'name' => 'my video no. 1',
                'url' => 'test',
            ])
            ->assertStatus(422);

        // unknown storage disk
        $this->json('POST', "/api/v1/projects/{$id}/videos", [
                'name' => 'my video no. 1',
                'url' => 'random',
            ])
            ->assertStatus(422);

        // video file not exist in storage disk
        $this->json('POST', "/api/v1/projects/{$id}/videos", [
                'name' => 'my video no. 1',
                'url' => 'test://video',
            ])
            ->assertStatus(422);

        Storage::fake('test');
        Storage::disk('test')->put('video.txt', 'abc');

        // invalid video format
        $this->json('POST', "/api/v1/projects/{$id}/videos", [
                'name' => 'my video no. 1',
                'url' => 'test://video.txt',
            ])
            ->assertStatus(422);

        $file = new File(__DIR__.'/../../../files/test.mp4');
        Storage::disk('test')->putFileAs('', $file, 'video.mp4');

        $this->assertFalse($project->videos()->exists());

        $this->json('POST', "/api/v1/projects/{$id}/videos", [
                'name' => 'my video no. 1',
                'url' => 'test://video.mp4',
                'gis_link' => 'gis',
                'doi' => '123',
            ])
            ->assertStatus(200)
            ->assertJson([
                'name' => 'my video no. 1',
                'url' => 'test://video.mp4',
                'gis_link' => 'gis',
                'doi' => '123',
            ]);

        $video = $project->videos()->first();
        $this->assertNotNull($video);
        $this->assertEquals(104500, $video->attrs['size']);
        $this->assertEquals('video/mp4', $video->attrs['mimetype']);
    }
}
