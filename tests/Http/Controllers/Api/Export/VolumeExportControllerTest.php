<?php

namespace Biigle\Tests\Modules\Sync\Http\Controllers\Api\Export;

use ZipArchive;
use Biigle\User;
use ApiTestCase;
use Biigle\Tests\VolumeTest;

class VolumeExportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $volume = VolumeTest::create();
        $this->doTestApiRoute('GET', '/api/v1/export/volumes');

        $this->beAdmin();
        $this->get('/api/v1/export/volumes')->assertStatus(403);

        $this->beGlobalAdmin();
        $response = $this->get('/api/v1/export/volumes')
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/zip')
            ->assertHeader('content-disposition', 'attachment; filename="biigle_volume_export.zip"');

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('volumes.json')));
        $this->assertEquals($volume->id, $contents->pluck('id')[0]);
        $this->assertNotNull($zip->getFromName('users.json'));
        $this->assertNotNull($zip->getFromName('label_trees.json'));
    }

    public function testShowExcept()
    {
        $volume1 = VolumeTest::create();
        $volume2 = VolumeTest::create();
        $id = $volume1->id;
        $this->beGlobalAdmin();
        $response = $this->get("/api/v1/export/volumes?except={$id}")->assertStatus(200);

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('volumes.json')));
        $this->assertEquals($volume2->id, $contents->pluck('id')[0]);
    }

    public function testShowOnly()
    {
        $volume1 = VolumeTest::create();
        $volume2 = VolumeTest::create();
        $id = $volume1->id;
        $this->beGlobalAdmin();
        $response = $this->get("/api/v1/export/volumes?only={$id}")->assertStatus(200);

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('volumes.json')));
        $this->assertEquals($volume1->id, $contents->pluck('id')[0]);
    }
}
