<?php


namespace Biigle\Tests\Modules\Ate\Http\Controllers\Views;

use ApiTestCase;

class AteControllerTest extends ApiTestCase
{
    public function testIndexVolume()
    {
        $id = $this->volume()->id;

        $this->get("volumes/{$id}/ate")
            ->assertResponseStatus(302);

        $this->beGuest();
        $this->get("volumes/{$id}/ate")
            ->assertResponseStatus(403);

        $this->beEditor();
        $this->get("volumes/{$id}/ate")
            ->assertResponseOk();
    }

    public function testIndexProject()
    {
        $id = $this->project()->id;

        $this->get("projects/{$id}/ate")
            ->assertResponseStatus(302);

        $this->beGuest();
        $this->get("projects/{$id}/ate")
            ->assertResponseStatus(403);

        $this->beEditor();
        $this->get("projects/{$id}/ate")
            ->assertResponseOk();
    }
}
