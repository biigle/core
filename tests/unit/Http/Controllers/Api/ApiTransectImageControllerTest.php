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
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/images");
        $content = $this->response->getContent();
        $this->assertResponseOk();
        $this->assertStringStartsWith('[', $content);
        $this->assertStringEndsWith(']', $content);
    }

    public function testStore()
    {
        $id = $this->transect()->id;
        ImageTest::create(['filename' => 'no.jpg', 'transect_id' => $id]);

        $this->doTestApiRoute('POST', "/api/v1/transects/{$id}/images");

        $this->beUser();
        $this->post("/api/v1/transects/{$id}/images");
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->post("/api/v1/transects/{$id}/images");
        $this->assertResponseStatus(401);

        $this->beEditor();
        $this->post("/api/v1/transects/{$id}/images");
        $this->assertResponseStatus(401);

        $this->beAdmin();
        $this->json('POST', "/api/v1/transects/{$id}/images");
        $this->assertResponseStatus(422);

        $this->assertEquals(1, $this->transect()->images()->count());
        $this->expectsJobs(\Dias\Jobs\GenerateThumbnails::class);

        $this->json('POST', "/api/v1/transects/{$id}/images", [
            'images' => '1.jpg, 1.jpg',
        ]);
        // duplicate image filename
        $this->assertResponseStatus(400);

        $this->json('POST', "/api/v1/transects/{$id}/images", [
            'images' => '1.jpg, 2.jpg',
        ]);

        $this->assertResponseOk();

        $this->seeJsonEquals([
            ['id' => 2, 'filename' => '1.jpg'],
            ['id' => 3, 'filename' => '2.jpg'],
        ]);


        $images = $this->transect()->images;
        $this->assertEquals(1, $images->where('filename', '1.jpg')->count());
        $this->assertEquals(1, $images->where('filename', '2.jpg')->count());
    }
}
