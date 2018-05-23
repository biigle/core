<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api;

use ApiTestCase;

class VolumeUserControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/users");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/users");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/users")
            ->assertStatus(200);
        $response->assertExactJson(
            $this->project()->users()
                ->select('id', 'firstname', 'lastname', 'email', 'affiliation')
                ->get()
                ->map(function ($item) {
                    unset($item->project_role_id);

                    return $item;
                })
                ->toArray()
        );
    }
}
