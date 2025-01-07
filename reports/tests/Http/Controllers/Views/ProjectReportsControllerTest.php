<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Views;

use ApiTestCase;
use Biigle\Tests\VideoTest;

class ProjectReportsControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $id = $this->project()->id;
        // Create the volume by calling it.
        $this->volume();

        $this->get("projects/{$id}/reports")->assertStatus(302);

        $this->beUser();
        $this->get("projects/{$id}/reports")->assertStatus(403);

        $this->beGuest();
        $this->get("projects/{$id}/reports")->assertStatus(200);
    }

    public function testShowEmpty()
    {
        $id = $this->project()->id;
        $this->beGuest();
        $this->get("projects/{$id}/reports")->assertStatus(404);
    }
}
