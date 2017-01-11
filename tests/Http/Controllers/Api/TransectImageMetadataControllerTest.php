<?php

namespace Biigle\Tests\Modules\Transects\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\TransectTest;
use Illuminate\Http\UploadedFile;

class TransectImageMetadataControllerTest extends ApiTestCase
{
    protected function getCsv($name)
    {
        $csv = __DIR__."/../../../files/{$name}";
        return new UploadedFile($csv, 'image-metadata.csv', 'text/csv', null, null, true);
    }

    public function testStore()
    {
        $id = $this->transect()->id;

        $this->doTestApiRoute('POST', "/api/v1/transects/{$id}/images/metadata");

        $csv = $this->getCsv('image-metadata.csv');
        $this->beEditor();
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csv]);
        // no permissions
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata");
        // file required
        $this->assertResponseStatus(302);

        $csv = $this->getCsv('image-metadata-nocols.csv');
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csv]);
        // columns required
        $this->assertResponseStatus(302);

        $csv = $this->getCsv('image-metadata-wrongcols.csv');
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csv]);
        // columns content invalid
        $this->assertResponseStatus(302);

        $csv = $this->getCsv('image-metadata-nolat.csv');
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csv]);
        // lng requires lat, too
        $this->assertResponseStatus(302);

        $csv = $this->getCsv('image-metadata-nolng.csv');
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csv]);
        // lat requires lng, too
        $this->assertResponseStatus(302);

        $csv = $this->getCsv('image-metadata-colcount.csv');
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csv]);
        // columns don't match file
        $this->assertResponseStatus(302);

        $csv = $this->getCsv('image-metadata.csv');
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csv]);
        // image does not exist
        $this->assertResponseStatus(302);

        $png = ImageTest::create([
            'filename' => 'abc.png',
            'transect_id' => $id,
        ]);
        $jpg = ImageTest::create([
            'filename' => 'abc.jpg',
            'transect_id' => $id,
        ]);

        $csv = $this->getCsv('image-metadata-colordering.csv');
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csv]);
        // date is no valid longitude
        $this->assertResponseStatus(302);

        $csv = $this->getCsv('image-metadata.csv');
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csv]);
        $this->assertResponseOk();

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
