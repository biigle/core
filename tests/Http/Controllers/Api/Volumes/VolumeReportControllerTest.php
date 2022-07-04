<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\ReportType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Storage;

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
            ->assertStatus(201);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(false, $report->options['exportArea']);
        $this->assertEquals(false, $report->options['newestLabel']);
        $response->assertJson(['id' => $report->id]);

        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'export_area' => true,
                'newest_label' => true,
            ])
            ->assertStatus(201);

        $job = end($this->dispatchedJobs);
        $this->assertEquals('high', $job->queue);
        $report = $job->report;
        $this->assertEquals($typeId, $report->type_id);
        $this->assertEquals($volumeId, $report->source_id);
        $this->assertEquals(true, $report->options['exportArea']);
        $this->assertEquals(true, $report->options['newestLabel']);
        $response->assertJson(['id' => $report->id]);
    }

    public function testStoreImageVolumeTypes()
    {
        $volumeId = $this->volume(['media_type_id' => MediaType::imageId()])->id;

        $types = [
            ReportType::imageAnnotationsAreaId(),
            ReportType::imageAnnotationsBasicId(),
            ReportType::imageAnnotationsCsvId(),
            ReportType::imageAnnotationsExtendedId(),
            ReportType::imageAnnotationsCocoId(),
            ReportType::imageAnnotationsFullId(),
            ReportType::imageAnnotationsAbundanceId(),
            ReportType::imageLabelsBasicId(),
            ReportType::imageLabelsCsvId(),
            // imageAnnotationImageLocation is tested below
            // imageAnnotationAnnotationLocation is tested below
            // imageLabelImageLocation is tested below
            // imageIfdo is tested below
        ];

        $this->beGuest();
        foreach ($types as $typeId) {
            $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                    'type_id' => $typeId,
                ])
                ->assertStatus(201);
        }
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
            ->assertStatus(201);
    }


    public function testStoreVideoVolumeTypes()
    {
        $volumeId = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $types = [
            ReportType::videoAnnotationsCsvId(),
            ReportType::videoLabelsCsvId(),
        ];

        $this->beGuest();
        foreach ($types as $typeId) {
            $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                    'type_id' => $typeId,
                ])
                ->assertStatus(201);
        }
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
            ->assertStatus(201);
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
            ->assertStatus(201);
    }

    public function testStoreImageAnnotationImageLocationWithoutLatLng()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $volumeId = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $volumeId]);

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => ReportType::imageAnnotationsImageLocationId(),
            ])
            ->assertStatus(422);

        $image->lat = 1;
        $image->lng = 1;
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => ReportType::imageAnnotationsImageLocationId(),
            ])
            ->assertStatus(201);
    }

    public function testStoreImageAnnotationAnnotationLocationWithoutLatLngYawDistance()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $volumeId = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $volumeId]);

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => ReportType::imageAnnotationsAnnotationLocationId(),
            ])
            // Metadata missing.
            ->assertStatus(422);

        $image->lat = 1;
        $image->lng = 1;
        $image->metadata = [
            'yaw' => 90,
            'distance_to_ground' => 10,
        ];
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => ReportType::imageAnnotationsAnnotationLocationId(),
            ])
            // Width/height missing.
            ->assertStatus(422);

        $image->width = 1;
        $image->height = 1;
        $image->save();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => ReportType::imageAnnotationsAnnotationLocationId(),
            ])
            ->assertStatus(201);
    }

    public function testStoreSeparateLabelTreesUsersConflict()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::imageAnnotationsBasicId();

        $this->beGuest();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'separate_label_trees' => true,
                'separate_users' => true,
            ])
            ->assertStatus(422);

        $this->expectsJobs(GenerateReportJob::class);
        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'separate_label_trees' => true,
            ])
            ->assertStatus(201);

        $job = end($this->dispatchedJobs);
        $this->assertTrue($job->report->options['separateLabelTrees']);

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
                'separate_users' => true,
            ])
            ->assertStatus(201);

        $job = end($this->dispatchedJobs);
        $this->assertTrue($job->report->options['separateUsers']);
    }

    public function testStoreImageIfdo()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::imageIfdoId();

        $this->beGuest();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(422);

        $disk = Storage::fake('ifdos');
        $disk->put($volumeId, 'abc');

        $this->expectsJobs(GenerateReportJob::class);
        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(201);
    }
}
