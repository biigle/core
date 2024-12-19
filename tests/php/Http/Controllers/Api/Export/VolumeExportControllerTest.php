<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\Tests\VolumeTest;
use ZipArchive;

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
            ->assertHeader('content-disposition', 'attachment; filename=biigle_volume_export.zip');

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('volumes.json')));
        $this->assertEquals($volume->id, $contents->pluck('id')[0]);
        $this->assertNotFalse($zip->getFromName('users.json'));
        $this->assertNotFalse($zip->getFromName('label_trees.json'));
        $this->assertNotFalse($zip->getFromName('images.csv'));
        $this->assertNotFalse($zip->getFromName('image_labels.csv'));
        $this->assertNotFalse($zip->getFromName('image_annotations.csv'));
        $this->assertNotFalse($zip->getFromName('image_annotation_labels.csv'));
        $this->assertNotFalse($zip->getFromName('videos.csv'));
        $this->assertNotFalse($zip->getFromName('video_labels.csv'));
        $this->assertNotFalse($zip->getFromName('video_annotations.csv'));
        $this->assertNotFalse($zip->getFromName('video_annotation_labels.csv'));
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

    public function testIsAllowed()
    {
        config(['sync.allowed_exports' => ['labelTrees', 'users']]);
        $this->beGlobalAdmin();
        $response = $this->get('/api/v1/export/volumes')->assertStatus(404);
    }
}
