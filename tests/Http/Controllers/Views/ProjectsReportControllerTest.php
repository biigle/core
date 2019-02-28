<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Views;

use ApiTestCase;

class ProjectsReportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->project()->id;
        // Create the volume by calling it.
        $this->volume();

        $response = $this->get("projects/{$id}/reports")->assertStatus(302);

        $this->beUser();
        $response = $this->get("projects/{$id}/reports")->assertStatus(403);

        $this->beGuest();
        $response = $this->get("projects/{$id}/reports")->assertStatus(200);
    }

    public function testShowEmpty()
    {
        $id = $this->project()->id;
        $this->beGuest();
        $response = $this->get("projects/{$id}/reports")->assertStatus(404);
    }
}
