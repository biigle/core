<?php

namespace Biigle\Tests\Http\Controllers\Views\Projects;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\VolumeTest;

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

    public function testShowUsesSingleReportTypeSelectorForImageAndVideoReports()
    {
        $id = $this->project()->id;
        $this->volume();
        $videoVolume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $this->project()->volumes()->attach($videoVolume);
        $this->beGuest();

        $response = $this->get("projects/{$id}/reports")
            ->assertStatus(200)
            ->assertSee('<select id="report-type"', false)
            ->assertSee('<option value="ImageAnnotations\\Csv"', false)
            ->assertSee('<option value="VideoAnnotations\\Csv"', false)
            ->assertDontSee('id="report-variant"', false)
            ->assertDontSee('btn-group btn-group-justified', false);

        $this->assertSame(1, substr_count($response->getContent(), 'id="report-type"'));
    }
}
