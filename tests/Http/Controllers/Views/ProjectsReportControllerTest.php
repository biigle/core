<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Views;

use ApiTestCase;

class ProjectsReportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->project()->id;

        $this->get("projects/{$id}/reports")
            ->assertResponseStatus(302);

        $this->beUser();
        $this->get("projects/{$id}/reports")
            ->assertResponseStatus(403);

        $this->beGuest();
        $this->get("projects/{$id}/reports")
            ->assertResponseOk();
    }
}
