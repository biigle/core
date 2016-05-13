<?php

use Dias\Role;

class TransectsModuleHttpControllersApiTransectImageControllerTest extends ApiTestCase {

    public function testIndexOrderByFilename() {
        $id = $this->transect()->id;

        $image1 = ImageTest::create(['transect_id' => $id, 'filename' => 'b.jpg']);
        $image2 = ImageTest::create(['transect_id' => $id, 'filename' => 'a.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/images/order-by/filename");

        $this->beUser();
        $this->get("/api/v1/transects/{$id}/images/order-by/filename");
        $this->assertResponseStatus(401);

        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            $expect = "[\"{$image2->id}\",\"{$image1->id}\"]";
        } else {
            $expect = "[{$image2->id},{$image1->id}]";
        }

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/images/order-by/filename")
            ->assertResponseOk();
        // ordering is crucial, so we can't simply use seeJsonEquals!
        $this->assertEquals($expect, $this->response->getContent());
    }
}
