<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Modules\Reports\Jobs\GenerateReportJob;
use Biigle\Modules\Reports\ReportType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Cache;
use Queue;
use Storage;

class ProjectReportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $projectId = $this->project()->id;
        // Create the volume by calling it.
        $this->volume();
        $typeId = ReportType::imageAnnotationsBasicId();

        $this->doTestApiRoute('POST', "api/v1/projects/{$projectId}/reports");

        $this->beUser();
        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports")
            ->assertStatus(403);

        $this->beGuest();
        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports")
            ->assertStatus(422);

        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(201);

        Queue::assertPushedOn('high', function (GenerateReportJob $job) use ($typeId, $projectId, $response) {
            $report = $job->report;
            $this->assertEquals($typeId, $report->type_id);
            $this->assertEquals($projectId, $report->source_id);
            $this->assertEquals(false, $report->options['exportArea']);
            $this->assertEquals(false, $report->options['newestLabel']);
            $response->assertJson(['id' => $report->id]);

            return true;
        });
    }

    public function testStoreOptions()
    {
        $projectId = $this->project()->id;
        // Create the volume by calling it.
        $this->volume();
        $typeId = ReportType::imageAnnotationsBasicId();
        $this->beGuest();

        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'export_area' => true,
                'newest_label' => true,
            ])
            ->assertStatus(201);

        Queue::assertPushedOn('high', function (GenerateReportJob $job) use ($typeId, $projectId, $response) {
            $report = $job->report;
            $this->assertEquals($typeId, $report->type_id);
            $this->assertEquals($projectId, $report->source_id);
            $this->assertEquals(true, $report->options['exportArea']);
            $this->assertEquals(true, $report->options['newestLabel']);
            $response->assertJson(['id' => $report->id]);

            return true;
        });
    }

    public function testStoreVideoVolume()
    {
        $projectId = $this->project()->id;
        // Create the volume by calling it.
        $this->volume(['media_type_id' => MediaType::videoId()]);
        $typeId = ReportType::videoAnnotationsCsvId();

        $this->beGuest();
        $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(201);

        Queue::assertPushed(function (GenerateReportJob $job) {
            $report = $job->report;
            $this->assertArrayNotHasKey('exportArea', $report->options);
            $this->assertArrayNotHasKey('aggregateChildLabels', $report->options);

            return true;
        });
    }

    public function testStoreNoVideoVolumes()
    {
        $projectId = $this->project()->id;
        $this->volume(['media_type_id' => MediaType::imageId()]);

        $types = [
            ReportType::videoAnnotationsCsvId(),
            ReportType::videoLabelsCsvId(),
            ReportType::videoIfdoId(),
        ];

        $this->beGuest();
        foreach ($types as $typeId) {
            $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                    'type_id' => $typeId,
                ])
                ->assertStatus(422);
        }
    }

    public function testStoreNoImageVolumes()
    {
        $projectId = $this->project()->id;
        $this->volume(['media_type_id' => MediaType::videoId()]);

        $types = [
            ReportType::imageAnnotationsAreaId(),
            ReportType::imageAnnotationsBasicId(),
            ReportType::imageAnnotationsCsvId(),
            ReportType::imageAnnotationsExtendedId(),
            ReportType::imageAnnotationsCocoId(),
            ReportType::imageAnnotationsFullId(),
            ReportType::imageAnnotationsAbundanceId(),
            ReportType::imageAnnotationsImageLocationId(),
            ReportType::imageAnnotationsAnnotationLocationId(),
            ReportType::imageLabelsBasicId(),
            ReportType::imageLabelsCsvId(),
            ReportType::imageLabelsImageLocationId(),
            ReportType::imageIfdoId(),
        ];

        $this->beGuest();
        foreach ($types as $typeId) {
            $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                    'type_id' => $typeId,
                ])
                ->assertStatus(422);
        }
    }

    public function testStoreOnlyLabels()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $projectId = $this->project()->id;
        // Create the volume by calling it.
        $this->volume();
        $typeId = ReportType::first()->id;
        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'only_labels' => [999],
            ])
            ->assertStatus(422);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'only_labels' => [$label->id],
            ])
            ->assertStatus(201);
    }

    public function testStoreImageLabelImageLocationWithoutLatLng()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $projectId = $this->project()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::imageLabelsImageLocationId(),
            ])
            ->assertStatus(422);

        $image->lat = 1;
        $image->lng = 1;
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::imageLabelsImageLocationId(),
            ])
            ->assertStatus(201);
    }

    public function testStoreImageAnnotationImageLocationWithoutLatLng()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $projectId = $this->project()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::imageAnnotationsImageLocationId(),
            ])
            ->assertStatus(422);

        $image->lat = 1;
        $image->lng = 1;
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::imageAnnotationsImageLocationId(),
            ])
            ->assertStatus(201);
    }

    public function testStoreImageAnnotationAnnotationLocationWithoutLatLngYawDistance()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $projectId = $this->project()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
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

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::imageAnnotationsAnnotationLocationId(),
            ])
            // Width/height missing.
            ->assertStatus(422);

        $image->width = 1;
        $image->height = 1;
        $image->save();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => ReportType::imageAnnotationsAnnotationLocationId(),
            ])
            ->assertStatus(201);
    }

    public function testStoreSeparateLabelTreesUsersConflict()
    {
        $projectId = $this->project()->id;
        // Create volume.
        $this->volume();
        $typeId = ReportType::imageAnnotationsBasicId();

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'separate_label_trees' => true,
                'separate_users' => true,
            ])
            ->assertStatus(422);
        Queue::assertNotPushed(GenerateReportJob::class);
    }

    public function testStoreSeparateLabelTrees()
    {
        $projectId = $this->project()->id;
        // Create volume.
        $this->volume();
        $typeId = ReportType::imageAnnotationsBasicId();

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'separate_label_trees' => true,
            ])
            ->assertStatus(201);

        Queue::assertPushed(function (GenerateReportJob $job) {
            $this->assertTrue($job->report->options['separateLabelTrees']);
            return true;
        });
    }

    public function testStoreSeparateUsers()
    {
        $projectId = $this->project()->id;
        // Create volume.
        $this->volume();
        $typeId = ReportType::imageAnnotationsBasicId();

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
                'separate_users' => true,
            ])
            ->assertStatus(201);

        Queue::assertPushed(function (GenerateReportJob $job) {
            $this->assertTrue($job->report->options['separateUsers']);
            return true;
        });
    }

    public function testStoreImageIfdo()
    {
        $projectId = $this->project()->id;
        // Create volume.
        $this->volume();
        $typeId = ReportType::imageIfdoId();

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(422);

        $disk = Storage::fake('ifdos');
        $disk->put($this->volume()->id.'.yaml', 'abc');
        Cache::flush();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(201);
        Queue::assertPushed(GenerateReportJob::class);
    }

    public function testStoreVideoIfdo()
    {
        $projectId = $this->project()->id;
        // Create volume.
        $this->volume(['media_type_id' => MediaType::videoId()]);
        $typeId = ReportType::videoIfdoId();

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(422);

        $disk = Storage::fake('ifdos');
        $disk->put($this->volume()->id.'.yaml', 'abc');
        Cache::flush();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
                'type_id' => $typeId,
            ])
            ->assertStatus(201);
        Queue::assertPushed(GenerateReportJob::class);
    }
}
