<?php

namespace Biigle\Tests\Modules\Export\Http\Controllers\Views;

use ApiTestCase;

class ProjectsReportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->project()->id;

        $response = $this->get("projects/{$id}/reports")
            ->assertStatus(302);

        $this->beUser();
        $response = $this->get("projects/{$id}/reports")
            ->assertStatus(403);

        $this->beGuest();
        $response = $this->get("projects/{$id}/reports")
            ->assertStatus(200);
    }
}
