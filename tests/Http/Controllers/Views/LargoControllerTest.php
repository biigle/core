<?php


namespace Biigle\Tests\Modules\Largo\Http\Controllers\Views;

use ApiTestCase;

class LargoControllerTest extends ApiTestCase
{
    public function testIndexVolume()
    {
        $id = $this->volume()->id;

        $this->get("volumes/{$id}/largo")
            ->assertResponseStatus(302);

        $this->beGuest();
        $this->get("volumes/{$id}/largo")
            ->assertResponseStatus(403);

        $this->beEditor();
        $this->get("volumes/{$id}/largo")
            ->assertResponseOk();
    }

    public function testIndexProject()
    {
        $id = $this->project()->id;

        $this->get("projects/{$id}/largo")
            ->assertResponseStatus(302);

        $this->beGuest();
        $this->get("projects/{$id}/largo")
            ->assertResponseStatus(403);

        $this->beEditor();
        $this->get("projects/{$id}/largo")
            ->assertResponseOk();
    }
}
