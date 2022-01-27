<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Illuminate\Http\UploadedFile;

class ImageMetadataControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->volume()->id;

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/images/metadata");

        $csv = new UploadedFile(__DIR__."/../../../../../files/image-metadata.csv", 'image-metadata.csv', 'text/csv', null, null, true);
        $this->beEditor();
        // no permissions
        $this->postJson("/api/v1/volumes/{$id}/images/metadata", ['metadata_csv' => $csv])
            ->assertStatus(403);

        $this->beAdmin();
        // file required
        $this->postJson("/api/v1/volumes/{$id}/images/metadata")->assertStatus(422);

        // image does not exist
        $this->postJson("/api/v1/volumes/{$id}/images/metadata", ['metadata_csv' => $csv])
            ->assertStatus(422);

        $png = ImageTest::create([
            'filename' => 'abc.png',
            'volume_id' => $id,
        ]);
        $jpg = ImageTest::create([
            'filename' => 'abc.jpg',
            'volume_id' => $id,
            'attrs' => ['metadata' => [
                'water_depth' => 4000,
                'distance_to_ground' => 20,
            ]],
        ]);

        $this->assertFalse($this->volume()->hasGeoInfo());

        $this->postJson("/api/v1/volumes/{$id}/images/metadata", ['metadata_csv' => $csv])
            ->assertStatus(200);

        $this->assertTrue($this->volume()->hasGeoInfo());

        $png = $png->fresh();
        $jpg = $jpg->fresh();

        $this->assertEquals('2016-12-19 12:27:00', $jpg->taken_at);
        $this->assertEquals(52.220, $jpg->lng);
        $this->assertEquals(28.123, $jpg->lat);
        $this->assertEquals(-1500, $jpg->metadata['gps_altitude']);
        $this->assertEquals(2.6, $jpg->metadata['area']);
        // Import should update but not destroy existing metadata.
        $this->assertEquals(10, $jpg->metadata['distance_to_ground']);
        $this->assertEquals(4000, $jpg->metadata['water_depth']);
        $this->assertEquals(180, $jpg->metadata['yaw']);

        $this->assertNull($png->taken_at);
        $this->assertNull($png->lng);
        $this->assertNull($png->lat);
        $this->assertEmpty($png->metadata);
    }

    public function testStoreMetadataText()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create([
            'filename' => 'abc.jpg',
            'volume_id' => $id,
            'attrs' => ['metadata' => [
                'water_depth' => 4000,
                'distance_to_ground' => 20,
            ]],
        ]);

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/images/metadata", [
            'metadata_text' => "filename,area,distance_to_ground\nabc.jpg,2.5,10",
        ])->assertSuccessful();

        $image->refresh();
        $this->assertEquals(4000, $image->metadata['water_depth']);
        $this->assertEquals(10, $image->metadata['distance_to_ground']);
        $this->assertEquals(2.5, $image->metadata['area']);
    }

    public function testStoreDeprecatedFileAttribute()
    {
        $id = $this->volume()->id;

        $image = ImageTest::create([
            'filename' => 'abc.jpg',
            'volume_id' => $id,
            'attrs' => ['metadata' => [
                'water_depth' => 4000,
                'distance_to_ground' => 20,
            ]],
        ]);

        $csv = new UploadedFile(__DIR__."/../../../../../files/image-metadata.csv", 'image-metadata.csv', 'text/csv', null, null, true);

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/images/metadata", ['file' => $csv])
            ->assertSuccessful();

        $image->refresh();
        $this->assertEquals(4000, $image->metadata['water_depth']);
        $this->assertEquals(10, $image->metadata['distance_to_ground']);
        $this->assertEquals(2.6, $image->metadata['area']);
    }
}
