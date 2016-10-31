<?php

class ApiTransectImageControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->transect()->id;

        $image = ImageTest::create(['transect_id' => $id]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/images");

        $this->beUser();
        $this->get("/api/v1/transects/{$id}/images");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/images");
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testStore()
    {
        // Don't use model factories here because order of image IDs is omportant.
        // Model factories use random IDs by default.
        $id = $this->transect()->id;
        $this->transect()->createImages(['no.jpg']);

        $this->doTestApiRoute('POST', "/api/v1/transects/{$id}/images");

        $this->beUser();
        $this->post("/api/v1/transects/{$id}/images");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->post("/api/v1/transects/{$id}/images");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->post("/api/v1/transects/{$id}/images");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->json('POST', "/api/v1/transects/{$id}/images");
        $this->assertResponseStatus(422);

        $this->assertEquals(1, $this->transect()->images()->count());
        $this->expectsJobs(\Dias\Jobs\GenerateThumbnails::class);
        $this->expectsEvents('images.created');

        $this->json('POST', "/api/v1/transects/{$id}/images", [
            'images' => '1.jpg, 1.jpg',
        ]);
        // error because of duplicate image
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/transects/{$id}/images", [
            'images' => '1.bmp',
        ]);
        // error because of unsupported image format
        $this->assertResponseStatus(422);

        $this->json('POST', "/api/v1/transects/{$id}/images", [
            'images' => '1.jpg, 2.jpg',
        ]);

        $this->assertResponseOk();

        $images = $this->transect()->images()
            ->where('filename', '!=', 'no.jpg')
            ->select('id', 'filename')
            ->get();

        $this->seeJsonEquals($images->toArray());

        $this->assertEquals(1, $images->where('filename', '1.jpg')->count());
        $this->assertEquals(1, $images->where('filename', '2.jpg')->count());
    }
}
