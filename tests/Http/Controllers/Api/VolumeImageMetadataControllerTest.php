<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Illuminate\Http\UploadedFile;

class VolumeImageMetadataControllerTest extends ApiTestCase
{
    protected function getCsv($name)
    {
        $csv = __DIR__."/../../../files/{$name}";

        return new UploadedFile($csv, 'image-metadata.csv', 'text/csv', null, null, true);
    }

    public function testStore()
    {
        $id = $this->volume()->id;

        $this->doTestApiRoute('POST', "/api/v1/volumes/{$id}/images/metadata");

        $csv = $this->getCsv('image-metadata.csv');
        $this->beEditor();
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata", [], [], ['file' => $csv]);
        // no permissions
        $response->assertStatus(403);

        $this->beAdmin();
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata");
        // file required
        $response->assertStatus(302);

        $csv = $this->getCsv('image-metadata-nocols.csv');
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata", [], [], ['file' => $csv]);
        // columns required
        $response->assertStatus(302);

        $csv = $this->getCsv('image-metadata-wrongcols.csv');
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata", [], [], ['file' => $csv]);
        // columns content invalid
        $response->assertStatus(302);

        $csv = $this->getCsv('image-metadata-nolat.csv');
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata", [], [], ['file' => $csv]);
        // lng requires lat, too
        $response->assertStatus(302);

        $csv = $this->getCsv('image-metadata-nolng.csv');
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata", [], [], ['file' => $csv]);
        // lat requires lng, too
        $response->assertStatus(302);

        $csv = $this->getCsv('image-metadata-colcount.csv');
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata", [], [], ['file' => $csv]);
        // columns don't match file
        $response->assertStatus(302);

        $csv = $this->getCsv('image-metadata.csv');
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata", [], [], ['file' => $csv]);
        // image does not exist
        $response->assertStatus(302);

        $png = ImageTest::create([
            'filename' => 'abc.png',
            'volume_id' => $id,
        ]);
        $jpg = ImageTest::create([
            'filename' => 'abc.jpg',
            'volume_id' => $id,
        ]);

        $csv = $this->getCsv('image-metadata-colordering.csv');
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata", [], [], ['file' => $csv]);
        // date is no valid longitude
        $response->assertStatus(302);

        $csv = $this->getCsv('image-metadata.csv');
        $response = $this->call('POST', "/api/v1/volumes/{$id}/images/metadata", [], [], ['file' => $csv]);
        $response->assertStatus(200);

        $png = $png->fresh();
        $jpg = $jpg->fresh();

        $this->assertEquals('2016-12-19 12:27:00', $jpg->taken_at);
        $this->assertEquals(52.220, $jpg->lng);
        $this->assertEquals(28.123, $jpg->lat);

        $this->assertNull($png->taken_at);
        $this->assertNull($png->lng);
        $this->assertNull($png->lat);
    }
}
