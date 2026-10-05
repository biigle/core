<?php

namespace Biigle\Tests\Http\Controllers\Views\Volumes;

use ApiTestCase;
use Biigle\MediaType;

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

    public function testShowUsesSingleReportTypeSelector()
    {
        $id = $this->volume()->id;
        $this->beGuest();

        $response = $this->get("volumes/{$id}/reports")
            ->assertStatus(200)
            ->assertSee('<select id="report-type"', false)
            ->assertSee('<option value="ImageAnnotations\\Csv"', false)
            ->assertDontSee('<option value="VideoAnnotations\\Csv"', false)
            ->assertDontSee('id="report-variant"', false)
            ->assertDontSee('btn-group btn-group-justified', false);

        $this->assertSame(1, substr_count($response->getContent(), 'id="report-type"'));
    }

    public function testShowVideoMetadataReport()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $this->beGuest();

        $this->get("volumes/{$id}/reports")
            ->assertStatus(200)
            ->assertSee('<option value="VideoMetadata"', false)
            ->assertSee('exports the current metadata for every video', false);
    }

    public function testShowImageMetadataReport()
    {
        $id = $this->volume(['media_type_id' => MediaType::imageId()])->id;
        $this->beGuest();

        $this->get("volumes/{$id}/reports")
            ->assertStatus(200)
            ->assertSee('<option value="ImageMetadata"', false)
            ->assertSee('exports the current metadata for every image', false);
    }
}
