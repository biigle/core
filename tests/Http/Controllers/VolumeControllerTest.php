<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers;

use ApiTestCase;

class VolumeControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->volume()->id;

        // not logged in
        $this->get("volumes/{$id}");
        $this->assertResponseStatus(302);

        // doesn't belong to project
        $this->beUser();
        $this->get("volumes/{$id}");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->get("volumes/{$id}");
        $this->assertResponseOk();

        $this->beAdmin();
        $this->get("volumes/{$id}");
        $this->assertResponseOk();

        // doesn't exist
        $this->get('projects/-1');
        $this->assertResponseStatus(404);
    }

    public function testCreate()
    {
        $id = $this->project()->id;

        // not logged in
        $this->get('volumes/create');
        $this->assertResponseStatus(302);

        $this->beEditor();
        // user is not allowed to edit the project
        $this->get('volumes/create?project='.$id);
        $this->assertResponseStatus(403);

        $this->beAdmin();
        // project doesn't exist
        $this->get('volumes/create?project=-1');
        $this->assertResponseStatus(404);

        $this->get('volumes/create?project='.$id);
        $this->assertResponseOk();
    }

    public function testEdit()
    {
        $id = $this->volume()->id;

        $this->beUser();
        $this->get("volumes/edit/{$id}");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("volumes/edit/{$id}");
        $this->assertResponseStatus(403);

        $this->beEditor();
        $this->get("volumes/edit/{$id}");
        $this->assertResponseStatus(403);

        // even the volume creator is not allowed if they are no project admin
        $this->be($this->volume()->creator);
        $this->get("volumes/edit/{$id}");
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->get("volumes/edit/{$id}");
        $this->assertResponseOk();

        $this->get('volumes/edit/999');
        $this->assertResponseStatus(404);
    }
}
