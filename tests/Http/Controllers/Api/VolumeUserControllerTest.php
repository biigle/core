<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api;

use Biigle\Role;
use ApiTestCase;

class VolumeUserControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/users");

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/users");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->get("/api/v1/volumes/{$id}/users")
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
