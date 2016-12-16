<?php

namespace Dias\Tests\Modules\Projects\Http\Controllers\Api;

use Dias\Role;
use ApiTestCase;
use Dias\Tests\ProjectTest;
use Dias\Tests\TransectTest;

class AttachableTransectsControllerTest extends ApiTestCase
{
    public function testIndex() {
        $validTransect = TransectTest::create();
        $validProject = ProjectTest::create();
        $validProject->addTransectId($validTransect->id);
        $validProject->addUserId($this->admin()->id, Role::$admin->id);

        $invalidTransect = TransectTest::create();
        $invalidProject = ProjectTest::create();
        $invalidProject->addTransectId($invalidTransect->id);
        $invalidProject->addUserId($this->admin()->id, Role::$editor->id);

        $existingTransect = $this->transect();
        $validProject->addTransectId($existingTransect->id); // should not be returned
        $id = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/attachable-transects");

        $this->beEditor();
        $this->get("/api/v1/projects/{$id}/attachable-transects");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->get("/api/v1/projects/{$id}/attachable-transects");
        $this->assertResponseOk();

        $this->seeJsonEquals([[
            'id' => $validTransect->id,
            'name' => $validTransect->name,
            'thumbnail' => null
        ]]);
    }
}
