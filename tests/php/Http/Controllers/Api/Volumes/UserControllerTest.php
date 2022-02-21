<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;

class UserControllerTest extends ApiTestCase
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
        $expect = $this->project()->users()
            ->select('id', 'firstname', 'lastname', 'affiliation')
            ->get()
            ->map(function ($item) {
                unset($item->project_role_id);

                return $item;
            })
            ->toArray();
        $response->assertSimilarJson($expect);
    }
}
