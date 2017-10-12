<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Image;
use Biigle\Volume;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageLabelTest;
use Illuminate\Support\Facades\Event;
use Biigle\Jobs\ProcessThumbnailChunkJob;

class ImageControllerTest extends ApiTestCase
{
    private $image;

    public function setUp()
    {
        parent::setUp();
        $this->image = ImageTest::create();
        $this->project()->volumes()->attach($this->image->volume);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/images/1');

        // api key authentication
        $this->beUser();
        $response = $this->get('/api/v1/images/1');
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get('/api/v1/images/-1');
        $response->assertStatus(404);

        $response = $this->get('/api/v1/images/1');
        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('"volume"', $content);
        $this->assertContains('"exif"', $content);
        $this->assertContains('"width"', $content);
        $this->assertContains('"height"', $content);
    }

    public function testShowImageLabels()
    {
        $label = ImageLabelTest::create(['image_id' => $this->image->id]);
        $this->beGuest();
        $this->get('/api/v1/images/1')
            ->assertJsonFragment($label->label->toArray())
            ->assertJsonFragment($label->user->toArray());
    }

    public function testShowThumb()
    {
        // generate thumbnail manually
        with(new ProcessThumbnailChunkJob(collect([$this->image])))->handle();
        $id = $this->image->id;

        $this->doTestApiRoute('GET', "/api/v1/images/{$id}/thumb");

        $this->beUser();
        $response = $this->get("/api/v1/images/{$id}/thumb");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get('/api/v1/images/-1/thumb');
        $response->assertStatus(404);

        $response = $this->get("/api/v1/images/{$id}/thumb");
        $response->assertStatus(200);
        $this->assertEquals('image/jpeg', $response->headers->get('content-type'));
    }

    public function testShowFile()
    {
        $this->doTestApiRoute('GET', '/api/v1/images/1/file');

        $this->beUser();
        $response = $this->get('/api/v1/images/1/file');
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get('/api/v1/images/-1/file');
        $response->assertStatus(404);

        $response = $this->get('/api/v1/images/1/file');
        $response->assertStatus(200);
        $this->assertEquals('image/jpeg', $response->headers->get('content-type'));
    }

    public function testDestroy()
    {
        $id = $this->image->id;

        $this->doTestApiRoute('DELETE', "/api/v1/images/{$id}");

        $this->beUser();
        $response = $this->delete("/api/v1/images/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->delete("/api/v1/images/{$id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->delete("/api/v1/images/{$id}");
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->delete('/api/v1/images/999');
        $response->assertStatus(404);

        $this->assertNotNull($this->image->fresh()->volume_id);
        $response = $this->delete("/api/v1/images/{$id}");
        $response->assertStatus(200);
        // only the volume ID is set to null so the image is marked for deletion
        $this->assertNull($this->image->fresh());
    }
}
