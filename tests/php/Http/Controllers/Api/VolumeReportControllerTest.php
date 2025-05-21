<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\GenerateReportJob;
use Biigle\MediaType;
use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\ReportType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Cache;
use Queue;
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

        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
        ])->assertStatus(201);

        Queue::assertPushedOn('high', function (GenerateReportJob $job) use ($typeId, $volumeId, $response) {
            $report = $job->report;
            $this->assertEquals($typeId, $report->type_id);
            $this->assertEquals($volumeId, $report->source_id);
            $this->assertEquals(false, $report->options['exportArea']);
            $this->assertEquals(false, $report->options['newestLabel']);
            $response->assertJson(['id' => $report->id]);

            return true;
        });
    }

    public function testStoreOptions()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::imageAnnotationsBasicId();
        $this->beGuest();

        $response = $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'export_area' => true,
            'newest_label' => true,
        ])->assertStatus(201);

        Queue::assertPushedOn('high', function (GenerateReportJob $job) use ($typeId, $volumeId, $response) {
            $report = $job->report;
            $this->assertEquals($typeId, $report->type_id);
            $this->assertEquals($volumeId, $report->source_id);
            $this->assertEquals(true, $report->options['exportArea']);
            $this->assertEquals(true, $report->options['newestLabel']);
            $response->assertJson(['id' => $report->id]);

            return true;
        });
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
            ])->assertStatus(201);
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
        ])->assertStatus(422);

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'aggregate_child_labels' => true,
        ])->assertStatus(422);

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
        ])->assertStatus(201);
        Queue::assertPushed(GenerateReportJob::class);
    }

    public function testStoreVideoVolumeTypes()
    {
        $volumeId = $this->volume(['media_type_id' => MediaType::videoId()])->id;

        $types = [
            ReportType::videoAnnotationsCsvId(),
            ReportType::videoLabelsCsvId(),
            // videoIfdo is tested below
        ];

        $this->beGuest();
        foreach ($types as $typeId) {
            $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
                'type_id' => $typeId,
            ])->assertStatus(201);
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
            'only_labels' => [-1],
        ])->assertStatus(422);

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'only_labels' => [$label->id],
        ])->assertStatus(201);
    }

    public function testStoreImageLabelImageLocationWithoutLatLng()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $volumeId = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $volumeId]);

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => ReportType::imageLabelsImageLocationId(),
        ])->assertStatus(422);

        $image->lat = 1;
        $image->lng = 1;
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => ReportType::imageLabelsImageLocationId(),
        ])->assertStatus(201);
    }

    public function testStoreImageAnnotationImageLocationWithoutLatLng()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $volumeId = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $volumeId]);

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => ReportType::imageAnnotationsImageLocationId(),
        ])->assertStatus(422);

        $image->lat = 1;
        $image->lng = 1;
        $image->save();
        $this->volume()->flushGeoInfoCache();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => ReportType::imageAnnotationsImageLocationId(),
        ])->assertStatus(201);
    }

    public function testStoreImageAnnotationAnnotationLocationWithoutLatLngYawDistance()
    {
        $this->beGuest();
        $label = LabelTest::create();
        $volumeId = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $volumeId]);

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => ReportType::imageAnnotationsAnnotationLocationId(),
        ])->assertStatus(422); // Metadata missing.

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
        ])->assertStatus(422); // Width/height missing.

        $image->width = 1;
        $image->height = 1;
        $image->save();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => ReportType::imageAnnotationsAnnotationLocationId(),
        ])->assertStatus(201);
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
        ])->assertStatus(422);
        Queue::assertNotPushed(GenerateReportJob::class);
    }

    public function testStoreSeparateLabelTrees()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::imageAnnotationsBasicId();

        $this->beGuest();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'separate_label_trees' => true,
        ])->assertStatus(201);

        Queue::assertPushed(function (GenerateReportJob $job) {
            $this->assertTrue($job->report->options['separateLabelTrees']);
            return true;
        });
    }

    public function testStoreSeparateUsers()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::imageAnnotationsBasicId();

        $this->beGuest();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'separate_users' => true,
        ])->assertStatus(201);

        Queue::assertPushed(function (GenerateReportJob $job) {
            $this->assertTrue($job->report->options['separateUsers']);
            return true;
        });
    }

    public function testStoreImageIfdo()
    {
        $volume = $this->volume();
        $volumeId = $volume->id;
        $typeId = ReportType::imageIfdoId();

        $this->beGuest();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
        ])->assertStatus(422);

        $volume->update([
            'metadata_file_path' => 'mymeta.json',
            'metadata_parser' => IfdoParser::class,
        ]);
        $disk = Storage::fake($volume->getMetadataFileDisk());
        $disk->put('mymeta.json', 'abc');
        Cache::flush();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
        ])->assertStatus(201);
        Queue::assertPushed(GenerateReportJob::class);
    }

    public function testStoreVideoIfdo()
    {
        $volume = $this->volume([
            'media_type_id' => MediaType::videoId(),
        ]);
        $volumeId = $volume->id;
        $typeId = ReportType::videoIfdoId();

        $this->beGuest();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
        ])->assertStatus(422);

        $volume->update([
            'metadata_file_path' => 'mymeta.json',
            'metadata_parser' => IfdoParser::class,
        ]);
        $disk = Storage::fake($volume->getMetadataFileDisk());
        $disk->put('mymeta.json', 'abc');
        Cache::flush();

        $this->postJson("api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
        ])->assertStatus(201);
        Queue::assertPushed(GenerateReportJob::class);
    }

    public function testStoreOptionsAllLabelsAggregateChildLabels()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::imageAnnotationsAbundanceId();
        $this->beGuest();

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'all_labels' => true,
            'aggregate_child_labels' => true,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['aggregate_child_labels']);

        // aggregate_child_labels option must not be present if all_labels is used
        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'all_labels' => true,
            'aggregate_child_labels' => false,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['aggregate_child_labels']);

        Queue::assertNotPushed(GenerateReportJob::class);
    }

    public function testStoreOptionsAllLabelsRestrictToLabels()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::imageAnnotationsAbundanceId();
        $this->beGuest();
        $lId = 1;

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'all_labels' => true,
            'only_labels' => [$lId],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['only_labels']);

        Queue::assertNotPushed(GenerateReportJob::class);
    }

    public function testStoreOptionsAllLabels()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::videoAnnotationsCsv();
        $this->beGuest();

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'all_labels' => true,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['all_labels', 'type_id']);

        Queue::assertNotPushed(GenerateReportJob::class);

        $typeId = ReportType::imageAnnotationsAbundanceId();

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'all_labels' => true,
        ])->assertSuccessful();

        Queue::assertPushed(function (GenerateReportJob $job) {
            $this->assertTrue($job->report->options['allLabels']);
            return true;
        });
    }

    public function testStoreOptionsAllLabelsRestrictToNewestLabels()
    {
        $volumeId = $this->volume()->id;
        $typeId = ReportType::imageAnnotationsAbundanceId();
        $this->beGuest();

        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'all_labels' => true,
            'newest_label' => true,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['newest_label']);

        // newest_label option must not be present if all_labels is used
        $this->json('POST', "api/v1/volumes/{$volumeId}/reports", [
            'type_id' => $typeId,
            'all_labels' => true,
            'newest_label' => false,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['newest_label']);

        Queue::assertNotPushed(GenerateReportJob::class);
    }
}
