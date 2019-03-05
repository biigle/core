<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Views;

use ApiTestCase;
use Biigle\Tests\Modules\Videos\VideoTest;

class ProjectReportControllerTest extends ApiTestCase
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

    public function testShowVideo()
    {
        if (!class_exists(VideoTest::class)) {
            $this->markTestSkipped('Requires biigle/videos');
        }

        $id = $this->project()->id;
        $this->beGuest();
        $this->get("projects/{$id}/reports")->assertStatus(404);
        VideoTest::create(['project_id' => $id]);
        $this->get("projects/{$id}/reports")->assertStatus(200);
    }
}
