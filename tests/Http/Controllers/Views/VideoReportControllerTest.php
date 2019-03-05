<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Views;

use ApiTestCase;
use Biigle\Tests\Modules\Videos\VideoTest;

class VideoReportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        if (!class_exists(VideoTest::class)) {
            $this->markTestSkipped('Requires the biigle/videos module.');
        }

        $video = VideoTest::create(['project_id' => $this->project()->id]);

        $this->get("videos/{$video->id}/reports")->assertStatus(302);

        $this->beUser();
        $this->get("videos/{$video->id}/reports")->assertStatus(403);

        $this->beGuest();
        $this->get("videos/{$video->id}/reports")->assertStatus(200);
    }
}
