<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Views;

use ApiTestCase;
use Biigle\Tests\VideoTest;

class VideoReportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $video = VideoTest::create(['project_id' => $this->project()->id]);

        $this->get("videos/{$video->id}/reports")->assertStatus(302);

        $this->beUser();
        $this->get("videos/{$video->id}/reports")->assertStatus(403);

        $this->beGuest();
        $this->get("videos/{$video->id}/reports")->assertStatus(200);
    }
}
