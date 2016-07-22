<?php

use Dias\Image;
use Dias\Transect;
use Dias\Services\Thumbnails\InterventionImage;

class ApiImageControllerTest extends ApiTestCase
{

    private $image;

    public function setUp()
    {
        parent::setUp();
        $this->image = ImageTest::create();
        $this->project()->addTransectId($this->image->transect->id);
    }

    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/images/1');

        // api key authentication
        $this->beUser();
        $this->get('/api/v1/images/1');
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('/api/v1/images/-1');
        $this->assertResponseStatus(404);

        $this->get('/api/v1/images/1');
        $this->assertResponseOk();
        $content = $this->response->getContent();
        $this->assertStringStartsWith('{', $content);
        $this->assertStringEndsWith('}', $content);
        $this->assertContains('"transect"', $content);
        $this->assertContains('"exif"', $content);
        $this->assertContains('"width"', $content);
        $this->assertContains('"height"', $content);
    }

    public function testShowThumb()
    {
        // generate thumbnail manually
        InterventionImage::$width = 10;
        InterventionImage::$height = 10;
        InterventionImage::makeThumbnail($this->image);
        $id = $this->image->id;

        $this->doTestApiRoute('GET', "/api/v1/images/{$id}/thumb");

        $this->beUser();
        $this->get("/api/v1/images/{$id}/thumb");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('/api/v1/images/-1/thumb');
        $this->assertResponseStatus(404);

        $this->get("/api/v1/images/{$id}/thumb");
        $this->assertResponseOk();
        $this->assertEquals('image/jpeg', $this->response->headers->get('content-type'));
    }

    public function testShowFile()
    {
        $this->doTestApiRoute('GET', '/api/v1/images/1/file');

        $this->beUser();
        $this->get('/api/v1/images/1/file');
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get('/api/v1/images/-1/file');
        $this->assertResponseStatus(404);

        $this->get('/api/v1/images/1/file');
        $this->assertResponseOk();
        $this->assertEquals('image/jpeg', $this->response->headers->get('content-type'));
    }

    public function testDestroy()
    {
        $id = $this->image->id;

        $this->doTestApiRoute('DELETE', "/api/v1/images/{$id}");

        $this->beUser();
        $this->delete("/api/v1/images/{$id}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->delete("/api/v1/images/{$id}");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->delete("/api/v1/images/{$id}");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->delete("/api/v1/images/999");
        $this->assertResponseStatus(404);

        $this->assertNotNull($this->image->fresh()->transect_id);
        $this->delete("/api/v1/images/{$id}");
        $this->assertResponseOk();
        // only the transect ID is set to null so the image is marked for deletion
        $this->assertNull($this->image->fresh());
    }
}
