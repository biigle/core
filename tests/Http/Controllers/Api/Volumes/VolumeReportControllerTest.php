<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\ReportType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;

class VolumeReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::imageAnnotationsBasicId();

        $this->doTestApiRoute('POST', "api/v1/volumes/{$volumeId}/reports");

        $this->beUser();
        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports")
            ->assertStatus(403);

        $this->beGuest();
        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports")
            ->assertStatus(422);

        $this->expectsJobs(GenerateReportJob::class);
        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(false, $report->options['exportArea']);
        $this->assertEquals(false, $report->options['newestLabel']);

        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'export_area' => true,
                'newest_label' => true,
            ])
            ->assertStatus(200);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(true, $report->options['exportArea']);
        $this->assertEquals(true, $report->options['newestLabel']);
    }

    public function testStoreInvalidVideoAnnotations()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::videoAnnotationsCsvId();

        $this->beGuest();
        $this->postJson("api/v1/volumes/{$volumeId}/reports", ['type_id' => $typeId])
            ->assertStatus(422);
    }

    public function testStoreInvalidVideoLabels()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::videoLabelsCsvId();

        $this->beGuest();
        $this->postJson("api/v1/volumes/{$volumeId}/reports", ['type_id' => $typeId])
            ->assertStatus(422);
    }

    public function testStoreVideoVolume()
    {
        $volumeId = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $typeId = ReportType::videoAnnotationsCsvId();

        $this->beGuest();
        $this->json('POST', "api/v1/volumes/{$volumeId}/reports")
            ->assertStatus(422);

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'export_area' => true,
            ])
            ->assertStatus(422);

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'aggregate_child_labels' => true,
            ])
            ->assertStatus(422);

        $this->expectsJobs(GenerateReportJob::class);
        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(200);
    }

    public function testStoreInvalidImageAnnotations()
    {
        $volumeId = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $typeId = ReportType::imageAnnotationsCsvId();

        $this->beGuest();
        $this->postJson("api/v1/volumes/{$volumeId}/reports", ['type_id' => $typeId])
            ->assertStatus(422);
    }

    public function testStoreInvalidImageLabels()
    {
        $volumeId = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $typeId = ReportType::imageLabelsCsvId();

        $this->beGuest();
        $this->postJson("api/v1/volumes/{$volumeId}/reports", ['type_id' => $typeId])
            ->assertStatus(422);
    }

    public function testStoreOnlyLabels()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $volumeId = $this->volume()->id;
        $typeId = ReportType::first()->id;
        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'only_labels' => [999],
            ])
            ->assertStatus(422);

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'only_labels' => [$label->id],
            ])
            ->assertStatus(200);
    }

    public function testStoreImageLabelImageLocationWithoutLatLng()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $volumeId = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $volumeId]);

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => ReportType::imageLabelsImageLocationId(),
            ])
            ->assertStatus(422);

        $image->lat = 1;
        $image->lng = 1;
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => ReportType::imageLabelsImageLocationId(),
            ])
            ->assertStatus(200);
    }
}
