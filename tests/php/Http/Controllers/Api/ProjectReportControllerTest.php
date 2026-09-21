<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\GenerateReportJob;
use Biigle\MediaType;
use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\ReportType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Volume;
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
        $typeId = ReportType::IMAGE_ANNOTATIONS_BASIC->value;

        $this->doTestApiRoute('POST', "api/v1/projects/{$projectId}/reports");

        $this->beUser();
        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports")
            ->assertStatus(403);

        $this->beGuest();
        $response = $this->json('POST', "api/v1/projects/{$projectId}/reports")
            ->assertStatus(422);

        $response = $this
            ->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type' => $typeId,
            ])
            ->assertStatus(201);

        Queue::assertPushedOn('high', function (GenerateReportJob $job) use ($typeId, $projectId, $response) {
            $report = $job->report;
            $this->assertEquals($typeId, $report->type->value);
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
        $typeId = ReportType::IMAGE_ANNOTATIONS_BASIC->value;
        $this->beGuest();

        $response = $this
            ->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type' => $typeId,
                'export_area' => true,
                'newest_label' => true,
            ])
            ->assertStatus(201);

        Queue::assertPushedOn('high', function (GenerateReportJob $job) use ($typeId, $projectId, $response) {
            $report = $job->report;
            $this->assertEquals($typeId, $report->type->value);
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
        $this->volume(['media_type' => MediaType::VIDEO->value]);
        $typeId = ReportType::VIDEO_ANNOTATIONS_CSV->value;

        $this->beGuest();
        $this->json('POST', "api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
        ])->assertStatus(201);

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
        $this->volume(['media_type' => MediaType::IMAGE->value]);

        $types = [
            ReportType::VIDEO_ANNOTATIONS_CSV->value,
            ReportType::VIDEO_LABELS_CSV->value,
            ReportType::VIDEO_IFDO->value,
        ];

        $this->beGuest();
        foreach ($types as $typeId) {
            $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type' => $typeId,
            ])->assertStatus(422);
        }
    }

    public function testStoreNoImageVolumes()
    {
        $projectId = $this->project()->id;
        $this->volume(['media_type' => MediaType::VIDEO->value]);

        $types = [
            ReportType::IMAGE_ANNOTATIONS_AREA->value,
            ReportType::IMAGE_ANNOTATIONS_BASIC->value,
            ReportType::IMAGE_ANNOTATIONS_CSV->value,
            ReportType::IMAGE_ANNOTATIONS_EXTENDED->value,
            ReportType::IMAGE_ANNOTATIONS_COCO->value,
            ReportType::IMAGE_ANNOTATIONS_FULL->value,
            ReportType::IMAGE_ANNOTATIONS_ABUNDANCE->value,
            ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION->value,
            ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value,
            ReportType::IMAGE_LABELS_BASIC->value,
            ReportType::IMAGE_LABELS_CSV->value,
            ReportType::IMAGE_LABELS_IMAGE_LOCATION->value,
            ReportType::IMAGE_IFDO->value,
        ];

        $this->beGuest();
        foreach ($types as $typeId) {
            $this->json('POST', "api/v1/projects/{$projectId}/reports", [
                'type' => $typeId,
            ])->assertStatus(422);
        }
    }

    public function testStoreOnlyLabels()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $projectId = $this->project()->id;
        // Create the volume by calling it.
        $this->volume();
        $typeId = ReportType::IMAGE_ANNOTATIONS_AREA->value;
        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
            'only_labels' => [999],
        ])->assertStatus(422);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
            'only_labels' => [$label->id],
        ])->assertStatus(201);
    }

    public function testStoreImageLabelImageLocationWithoutLatLng()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $projectId = $this->project()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => ReportType::IMAGE_LABELS_IMAGE_LOCATION->value,
        ])->assertStatus(422);

        $image->lat = 1;
        $image->lng = 1;
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => ReportType::IMAGE_LABELS_IMAGE_LOCATION->value,
        ])->assertStatus(201);
    }

    public function testStoreImageAnnotationImageLocationWithoutLatLng()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $projectId = $this->project()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION->value,
        ])->assertStatus(422);

        $image->lat = 1;
        $image->lng = 1;
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION->value,
        ])->assertStatus(201);
    }

    public function testStoreImageAnnotationAnnotationLocationWithoutLatLngYawDistance()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $projectId = $this->project()->id;
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value,
        ])->assertStatus(422); // Metadata missing.

        $image->lat = 1;
        $image->lng = 1;
        $image->metadata = [
            'yaw' => 90,
            'distance_to_ground' => 10,
        ];
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value,
        ])->assertStatus(422); // Width/height missing.

        $image->width = 1;
        $image->height = 1;
        $image->save();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value,
        ])->assertStatus(201);
    }

    public function testStoreSeparateLabelTreesUsersConflict()
    {
        $projectId = $this->project()->id;
        // Create volume.
        $this->volume();
        $typeId = ReportType::IMAGE_ANNOTATIONS_BASIC->value;

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
            'separate_label_trees' => true,
            'separate_users' => true,
        ])->assertStatus(422);
        Queue::assertNotPushed(GenerateReportJob::class);
    }

    public function testStoreSeparateLabelTrees()
    {
        $projectId = $this->project()->id;
        // Create volume.
        $this->volume();
        $typeId = ReportType::IMAGE_ANNOTATIONS_BASIC->value;

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
            'separate_label_trees' => true,
        ])->assertStatus(201);

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
        $typeId = ReportType::IMAGE_ANNOTATIONS_BASIC->value;

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
            'separate_users' => true,
        ])->assertStatus(201);

        Queue::assertPushed(function (GenerateReportJob $job) {
            $this->assertTrue($job->report->options['separateUsers']);
            return true;
        });
    }

    public function testStoreImageIfdo()
    {
        $projectId = $this->project()->id;
        // Create volume.
        $volume = $this->volume();
        $typeId = ReportType::IMAGE_IFDO->value;

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
        ])->assertStatus(422);

        $volume->update([
            'metadata_file_path' => 'mymeta.json',
            'metadata_parser' => IfdoParser::class,
        ]);
        $disk = Storage::fake($volume->getMetadataFileDisk());
        $disk->put('mymeta.json', 'abc');
        Cache::flush();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
        ])->assertStatus(201);
        Queue::assertPushed(GenerateReportJob::class);
    }

    public function testStoreVideoIfdo()
    {
        $projectId = $this->project()->id;
        // Create volume.
        $volume = $this->volume([
            'media_type' => MediaType::VIDEO->value,
        ]);
        $typeId = ReportType::VIDEO_IFDO->value;

        $this->beGuest();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
        ])->assertStatus(422);

        $volume->update([
            'metadata_file_path' => 'mymeta.json',
            'metadata_parser' => IfdoParser::class,
        ]);
        $disk = Storage::fake($volume->getMetadataFileDisk());
        $disk->put('mymeta.json', 'abc');
        Cache::flush();

        $this->postJson("api/v1/projects/{$projectId}/reports", [
            'type' => $typeId,
        ])->assertStatus(201);
        Queue::assertPushed(GenerateReportJob::class);
    }
}
