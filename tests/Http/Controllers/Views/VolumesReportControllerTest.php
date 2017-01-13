<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Views;

use ApiTestCase;

class VolumesReportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->volume()->id;

        $this->get("volumes/{$id}/reports")
            ->assertResponseStatus(302);

        $this->beUser();
        $this->get("volumes/{$id}/reports")
            ->assertResponseStatus(403);

        $this->beGuest();
        $this->get("volumes/{$id}/reports")
            ->assertResponseOk();
    }
}
