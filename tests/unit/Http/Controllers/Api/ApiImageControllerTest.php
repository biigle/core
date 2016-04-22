<?php

use Dias\Image;
use Dias\Transect;
use Dias\Services\Thumbnails\InterventionImage;

class ApiImageControllerTest extends ModelWithAttributesApiTest
{
    protected function getEndpoint()
    {
        return '/api/v1/images';
    }

    protected function getModel()
    {
        $model = ImageTest::create();
        $this->project()->addTransectId($model->transect->id);

        return $model;
    }

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
        $this->assertResponseStatus(401);

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
        $this->assertResponseStatus(401);

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
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get('/api/v1/images/-1/file');
        $this->assertResponseStatus(404);

        $r = $this->get('/api/v1/images/1/file');
        $this->assertResponseOk();
        $this->assertEquals('image/jpeg', $this->response->headers->get('content-type'));
    }
}
