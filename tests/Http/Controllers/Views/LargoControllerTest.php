<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Views;

use ApiTestCase;

class LargoControllerTest extends ApiTestCase
{
    public function testIndexVolume()
    {
        $id = $this->volume()->id;

        $response = $this->get("volumes/{$id}/largo")
            ->assertStatus(302);

        $this->beGuest();
        $response = $this->get("volumes/{$id}/largo")
            ->assertStatus(403);

        $this->beEditor();
        $response = $this->get("volumes/{$id}/largo")
            ->assertStatus(200);
    }

    public function testIndexProject()
    {
        $id = $this->project()->id;

        $response = $this->get("projects/{$id}/largo")
            ->assertStatus(302);

        $this->beGuest();
        $response = $this->get("projects/{$id}/largo")
            ->assertStatus(403);

        $this->beEditor();
        $response = $this->get("projects/{$id}/largo")
            ->assertStatus(200);
    }
}
