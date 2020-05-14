<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Api;

use Queue;
use Storage;
use ApiTestCase;
use GuzzleHttp\Client;
use Illuminate\Http\File;
use GuzzleHttp\Middleware;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Biigle\Modules\Videos\Video;
use Biigle\Modules\Videos\Project;
use GuzzleHttp\Handler\MockHandler;
use Biigle\Tests\Modules\Videos\VideoTest;
use Biigle\Modules\Videos\Jobs\ProcessNewVideo;
use Biigle\Modules\Videos\Support\VideoCodecExtractor;

class ProjectVideoControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;
        $project = Project::find($id);
        $video = VideoTest::create(['project_id' => $id]);
        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/videos");

        $this->beUser();
        $this->get("/api/v1/projects/{$id}/videos")->assertStatus(403);

        $this->beGuest();
        $this->get("/api/v1/projects/{$id}/videos")
            ->assertStatus(200)
            ->assertExactJson([$video->toArray()]);
    }

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

        Queue::fake();
        Storage::fake('test');
        Storage::disk('test')->put('video.txt', 'abc');

        // invalid video format
        $this->json('POST', "/api/v1/projects/{$id}/videos", [
                'name' => 'my video no. 1',
                'url' => 'test://video.txt',
            ])
            ->assertStatus(422);

        $file = new File(__DIR__.'/../../../files/test_malformed.mp4');
        Storage::disk('test')->putFileAs('', $file, 'video.mp4');

        // malformed video file
        $this->json('POST', "/api/v1/projects/{$id}/videos", [
                'name' => 'my video no. 1',
                'url' => 'test://video.mp4',
                'gis_link' => 'gis',
                'doi' => '123',
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
            ->assertSuccessful()
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
        $this->assertEquals($this->admin()->id, $video->creator_id);
        Queue::assertPushed(ProcessNewVideo::class);
    }

    public function testStoreRemote()
    {
        $response = new Response(200, [
            'Content-Type' => ['video/mp4; charset=whatever'],
            'Content-Length' => ['12345'],
        ]);
        // One response for the validation and one for fetching the attrs.
        $mock = new MockHandler([$response, $response]);
        $container = [];
        $history = Middleware::history($container);
        $handler = HandlerStack::create($mock);
        $handler->push($history);
        $client = new Client(['handler' => $handler]);
        $this->app->bind(Client::class, function () use ($client) {
            return $client;
        });

        $this->app->bind(VideoCodecExtractor::class, function () {
            return new class {
                public function extract($url) {
                    return 'h264';
                }
            };
        });

        $id = $this->project()->id;
        $project = Project::find($id);
        $this->beAdmin();
        $this->json('POST', "/api/v1/projects/{$id}/videos", [
                'name' => 'my video no. 2',
                'url' => 'https://domain.tld/video.mp4',
            ])
            ->assertSuccessful();

        $video = $project->videos()->first();
        $this->assertNotNull($video);
        $this->assertEquals(12345, $video->attrs['size']);
        $this->assertEquals('video/mp4', $video->attrs['mimetype']);
    }
}
