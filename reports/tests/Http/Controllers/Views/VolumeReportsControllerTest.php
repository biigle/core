<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Views;

use ApiTestCase;

class VolumeReportsControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->volume()->id;

        $response = $this->get("volumes/{$id}/reports")
            ->assertStatus(302);

        $this->beUser();
        $response = $this->get("volumes/{$id}/reports")
            ->assertStatus(403);

        $this->beGuest();
        $response = $this->get("volumes/{$id}/reports")
            ->assertStatus(200);
    }
}
