<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VideoTest;
use Illuminate\Http\UploadedFile;
use Storage;

class MetadataControllerTest extends ApiTestCase
{
    public function testStoreDeprecated()
    {
        $id = $this->volume()->id;
        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/images/metadata");
    }

    public function testStoreImageMetadata()
    {
        $id = $this->volume()->id;

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/metadata");

        $csv = new UploadedFile(__DIR__."/../../../../../files/image-metadata.csv", 'image-metadata.csv', 'text/csv', null, true);
        $this->beEditor();
        // no permissions
        $this->postJson("/api/v1/volumes/{$id}/metadata", ['metadata_csv' => $csv])
            ->assertStatus(403);

        $this->beAdmin();
        // file required
        $this->postJson("/api/v1/volumes/{$id}/metadata")->assertStatus(422);

        // image does not exist
        $this->postJson("/api/v1/volumes/{$id}/metadata", ['metadata_csv' => $csv])
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

        $this->postJson("/api/v1/volumes/{$id}/metadata", ['metadata_csv' => $csv])
            ->assertStatus(200);

        $this->assertTrue($this->volume()->hasGeoInfo());

        $png = $png->fresh();
        $jpg = $jpg->fresh();

        $this->assertSame('2016-12-19 12:27:00', $jpg->taken_at->toDateTimeString());
        $this->assertSame(52.220, $jpg->lng);
        $this->assertSame(28.123, $jpg->lat);
        $this->assertSame(-1500, intval($jpg->metadata['gps_altitude']));
        $this->assertSame(2.6, floatval($jpg->metadata['area']));
        // Import should update but not destroy existing metadata.
        $this->assertSame(10, intval($jpg->metadata['distance_to_ground']));
        $this->assertSame(4000, $jpg->metadata['water_depth']);
        $this->assertSame(180, intval($jpg->metadata['yaw']));

        $this->assertNull($png->taken_at);
        $this->assertNull($png->lng);
        $this->assertNull($png->lat);
        $this->assertEmpty($png->metadata);
    }

    public function testStoreStringMetadata()
    {
        $id = $this->volume()->id;

        $this->beAdmin();

        $this->postJson("/api/v1/volumes/{$id}/metadata", ['metadata_csv' => "metadata_string"])
            ->assertStatus(422);
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

        $csv = new UploadedFile(__DIR__."/../../../../../files/image-metadata.csv", 'metadata.csv', 'text/csv', null, true);

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", ['file' => $csv])
            ->assertSuccessful();

        $image->refresh();
        $this->assertSame(4000, $image->metadata['water_depth']);
        $this->assertSame(10, intval($image->metadata['distance_to_ground']));
        $this->assertSame(2.6, floatval($image->metadata['area']));
    }

    public function testStoreImageMetadataText()
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
        $this->postJson("/api/v1/volumes/{$id}/metadata", [
            'metadata_text' => "filename,area,distance_to_ground\nabc.jpg,2.5,10",
        ])->assertSuccessful();

        $image->refresh();
        $this->assertSame(4000, $image->metadata['water_depth']);
        $this->assertSame(10, intval($image->metadata['distance_to_ground']));
        $this->assertSame(2.5, floatval($image->metadata['area']));
    }

    public function testStoreVideoMetadataCsv()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $video = VideoTest::create([
            'filename' => 'abc.mp4',
            'volume_id' => $id,
            'taken_at' => ['2016-12-19 12:27:00', '2016-12-19 12:28:00'],
            'attrs' => ['metadata' => [
                'distance_to_ground' => [20, 120],
            ]],
        ]);

        $csv = new UploadedFile(__DIR__."/../../../../../files/video-metadata.csv", 'metadata.csv', 'text/csv', null, true);

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", ['file' => $csv])
            ->assertSuccessful();

        $video->refresh();
        $this->assertSame([10, 5], $video->metadata['distance_to_ground']);
        $this->assertSame([180, 181], $video->metadata['yaw']);
    }

    public function testStoreVideoMetadataText()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $video = VideoTest::create([
            'filename' => 'abc.mp4',
            'volume_id' => $id,
            'taken_at' => ['2022-02-24 16:07:00', '2022-02-24 16:08:00'],
            'attrs' => ['metadata' => [
                'water_depth' => [4000, 4100],
                'distance_to_ground' => [20, 120],
            ]],
        ]);

        $text = <<<TEXT
filename,taken_at,area,distance_to_ground
abc.mp4,2022-02-24 16:07:00,2.5,10
abc.mp4,2022-02-24 16:08:00,3.5,150
TEXT;

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", [
            'metadata_text' => $text,
        ])->assertSuccessful();

        $video->refresh();
        $this->assertCount(2, $video->taken_at);
        $this->assertSame([4000, 4100], $video->metadata['water_depth']);
        $this->assertSame([10, 150], $video->metadata['distance_to_ground']);
        $this->assertSame([2.5, 3.5], $video->metadata['area']);
    }

    public function testStoreVideoMetadataMerge()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $video = VideoTest::create([
            'filename' => 'abc.mp4',
            'volume_id' => $id,
            'taken_at' => ['2022-02-24 16:07:00', '2022-02-24 16:08:00'],
            'attrs' => ['metadata' => [
                'water_depth' => [4000, 4100],
                'distance_to_ground' => [20, 120],
            ]],
        ]);

        $text = <<<TEXT
filename,taken_at,area,distance_to_ground
abc.mp4,2022-02-24 16:07:00,2.5,
abc.mp4,2022-02-24 16:09:00,3.5,150
TEXT;

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", [
            'metadata_text' => $text,
        ])->assertSuccessful();

        $video->refresh();
        $this->assertCount(3, $video->taken_at);
        $this->assertSame([4000, 4100, null], $video->metadata['water_depth']);
        $this->assertSame([20, 120, 150], $video->metadata['distance_to_ground']);
        $this->assertSame([2.5, null, 3.5], $video->metadata['area']);
    }

    public function testStoreVideoMetadataFillOneVideoButNotTheOther()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $video1 = VideoTest::create([
            'filename' => 'abc.mp4',
            'volume_id' => $id,
            'taken_at' => ['2022-02-24 16:07:00', '2022-02-24 16:08:00'],
            'attrs' => ['metadata' => [
                'distance_to_ground' => [20, 120],
            ]],
        ]);

        $video2 = VideoTest::create([
            'filename' => 'def.mp4',
            'volume_id' => $id,
            'taken_at' => ['2022-02-24 16:07:00', '2022-02-24 16:08:00'],
            'attrs' => ['metadata' => []],
        ]);

        $text = <<<TEXT
filename,taken_at,area,distance_to_ground
abc.mp4,2022-02-24 16:07:00,2.5,10
abc.mp4,2022-02-24 16:09:00,3.5,150
def.mp4,2022-02-24 16:07:00,2.5,
def.mp4,2022-02-24 16:09:00,3.5,
TEXT;

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", [
            'metadata_text' => $text,
        ])->assertSuccessful();

        $video1->refresh();
        $video2->refresh();
        $this->assertSame([10, 120, 150], $video1->metadata['distance_to_ground']);
        $this->assertArrayNotHasKey('distance_to_ground', $video2->metadata);
    }

    public function testStoreVideoMetadataCannotUpdateTimestampedWithBasic()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $video = VideoTest::create([
            'filename' => 'abc.mp4',
            'volume_id' => $id,
            'taken_at' => ['2022-02-24 16:07:00', '2022-02-24 16:08:00'],
            'attrs' => ['metadata' => [
                'water_depth' => [4000, 4100],
                'distance_to_ground' => [20, 120],
            ]],
        ]);

        $this->beAdmin();
        // The video has timestamped metadata. There is no way the new area data without
        // timestamp can be merged into the timestamped data.
        $this->postJson("/api/v1/volumes/{$id}/metadata", [
            'metadata_text' => "filename,area\nabc.mp4,2.5",
        ])->assertStatus(422);
    }

    public function testStoreVideoMetadataCannotUpdateBasicWithTimestamped()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $video = VideoTest::create([
            'filename' => 'abc.mp4',
            'volume_id' => $id,
            'attrs' => ['metadata' => [
                'water_depth' => [4000],
                'distance_to_ground' => [20],
            ]],
        ]);

        $text = <<<TEXT
filename,taken_at,area,distance_to_ground
abc.mp4,2022-02-24 16:07:00,2.5,10
abc.mp4,2022-02-24 16:09:00,3.5,150
TEXT;

        $this->beAdmin();
        // The video has basic metadata. There is no way the new area data with
        // timestamp can be merged into the basic data.
        $this->postJson("/api/v1/volumes/{$id}/metadata", [
            'metadata_text' => $text,
        ])->assertStatus(422);
    }

    public function testStoreVideoMetadataZerosSingle()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $video = VideoTest::create([
            'filename' => 'abc.mp4',
            'volume_id' => $id,
        ]);

        $text = <<<TEXT
filename,taken_at,area
abc.mp4,2022-02-24 16:07:00,0
TEXT;

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", [
            'metadata_text' => $text,
        ])->assertSuccessful();

        $video->refresh();
        $this->assertSame([0], $video->metadata['area']);
    }

    public function testStoreVideoMetadataZeros()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $video = VideoTest::create([
            'filename' => 'abc.mp4',
            'volume_id' => $id,
        ]);

        $text = <<<TEXT
filename,taken_at,area
abc.mp4,2022-02-24 16:07:00,0
abc.mp4,2022-02-24 16:08:00,1
TEXT;

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", [
            'metadata_text' => $text,
        ])->assertSuccessful();

        $video->refresh();
        $this->assertSame([0, 1], $video->metadata['area']);
    }

    public function testStoreVideoMetadataIncorrectEncoding()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();

        $video = VideoTest::create([
            'filename' => 'my-video.mp4',
            'volume_id' => $id,
        ]);

        $csv = new UploadedFile(__DIR__."/../../../../../files/video-metadata-incorrect-encoding.csv", 'metadata.csv', 'text/csv', null, true);

        $this->beAdmin();
        $this->postJson("/api/v1/volumes/{$id}/metadata", ['file' => $csv])
            ->assertStatus(422);
    }

    public function testStoreImageIfdoFile()
    {
        $id = $this->volume()->id;
        $this->beAdmin();
        $file = new UploadedFile(__DIR__."/../../../../../files/image-ifdo.yaml", 'ifdo.yaml', 'application/yaml', null, true);

        Storage::fake('ifdos');

        $this->assertFalse($this->volume()->hasIfdo());

        $this->postJson("/api/v1/volumes/{$id}/metadata", ['ifdo_file' => $file])
            ->assertSuccessful();

        $this->assertTrue($this->volume()->hasIfdo());
    }

    public function testStoreVideoIfdoFile()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();
        $this->beAdmin();
        $file = new UploadedFile(__DIR__."/../../../../../files/video-ifdo.yaml", 'ifdo.yaml', 'application/yaml', null, true);

        Storage::fake('ifdos');

        $this->assertFalse($this->volume()->hasIfdo());

        $this->postJson("/api/v1/volumes/{$id}/metadata", ['ifdo_file' => $file])
            ->assertSuccessful();

        $this->assertTrue($this->volume()->hasIfdo());
    }

    public function testStoreVideoIfdoFileForImageVolume()
    {
        $id = $this->volume()->id;
        $this->beAdmin();
        $file = new UploadedFile(__DIR__."/../../../../../files/video-ifdo.yaml", 'ifdo.yaml', 'application/yaml', null, true);

        $this->postJson("/api/v1/volumes/{$id}/metadata", ['ifdo_file' => $file])
            ->assertStatus(422);
    }

    public function testStoreImageIfdoFileForVideoVolume()
    {
        $id = $this->volume()->id;
        $this->volume()->media_type_id = MediaType::videoId();
        $this->volume()->save();
        $this->beAdmin();
        $file = new UploadedFile(__DIR__."/../../../../../files/image-ifdo.yaml", 'ifdo.yaml', 'application/yaml', null, true);

        $this->postJson("/api/v1/volumes/{$id}/metadata", ['ifdo_file' => $file])
            ->assertStatus(422);
    }
}
