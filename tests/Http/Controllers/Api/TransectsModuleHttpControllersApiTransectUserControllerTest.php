<?php

use Dias\Role;

class TransectsModuleHttpControllersApiTransectUserControllerTest extends ApiTestCase {

    public function testIndex() {
        $id = $this->transect()->id;

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/users");

        $this->beEditor();
        $this->get("/api/v1/transects/{$id}/users");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->get("/api/v1/transects/{$id}/users")
            ->assertResponseOk();
        $this->seeJsonEquals(
            $this->project()->users()
                ->select('id', 'firstname', 'lastname', 'email')
                ->get()
                ->map(function ($item) {
                    unset($item->project_role_id);
                    return $item;
                })
                ->toArray()
        );
    }
}
