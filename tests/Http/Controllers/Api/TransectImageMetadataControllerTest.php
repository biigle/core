<?php

namespace Dias\Tests\Modules\Transects\Http\Controllers\Api;

use ApiTestCase;
use Dias\Tests\ImageTest;
use Dias\Tests\TransectTest;
use Illuminate\Http\UploadedFile;

class TransectImageMetadataControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $id = $this->transect()->id;

        $csv = __DIR__.'/../../../files/image-metadata.csv';
        $csvFile = new UploadedFile($csv, 'image-metadata.csv', 'text/csv', null, null, true);

        $this->doTestApiRoute('POST', "/api/v1/transects/{$id}/images/metadata");

        $this->beEditor();
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [
            'columns' => ['taken_at', 'lng', 'lat'],
        ], [], ['file' => $csvFile]);
        // columns required
        $this->assertResponseStatus(403);

        $this->beAdmin();
        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [], [], ['file' => $csvFile]);
        // columns required
        $this->assertResponseStatus(302);

        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", ['columns' => ['taken_at']]);
        // file required
        $this->assertResponseStatus(302);

        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [
            'columns' => ['abc'],
        ], [], ['file' => $csvFile]);
        // columns content invalid
        $this->assertResponseStatus(302);

        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [
            'columns' => ['lng'],
        ], [], ['file' => $csvFile]);
        // lng requires lat, too
        $this->assertResponseStatus(302);

        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [
            'columns' => ['lat'],
        ], [], ['file' => $csvFile]);
        // lat requires lng, too
        $this->assertResponseStatus(302);

        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [
            'columns' => ['taken_at'],
        ], [], ['file' => $csvFile]);
        // columns don't match file
        $this->assertResponseStatus(302);

        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [
            'columns' => ['taken_at', 'lng', 'lat'],
        ], [], ['file' => $csvFile]);
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

        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [
            'columns' => ['lng', 'lat', 'taken_at'],
        ], [], ['file' => $csvFile]);
        // date is no valid longitude
        $this->assertResponseStatus(302);

        $this->call('POST', "/api/v1/transects/{$id}/images/metadata", [
            'columns' => ['taken_at', 'lng', 'lat'],
        ], [], ['file' => $csvFile]);
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
