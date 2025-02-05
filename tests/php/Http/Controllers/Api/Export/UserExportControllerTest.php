<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\User;
use ZipArchive;

class UserExportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/export/users');

        $this->beAdmin();
        $this->get('/api/v1/export/users')->assertStatus(403);

        $this->beGlobalAdmin();
        $response = $this->get('/api/v1/export/users')
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/zip')
            ->assertHeader('content-disposition', 'attachment; filename=biigle_user_export.zip');

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('users.json')));
        $expect = User::orderBy('id')->pluck('id');
        $this->assertEquals($expect, $contents->sortBy('id')->pluck('id'));
    }

    public function testShowExcept()
    {
        $id = $this->user()->id;
        $this->beGlobalAdmin();
        $response = $this->get("/api/v1/export/users?except={$id}")->assertStatus(200);

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('users.json')));
        $expect = User::where('id', '!=', $id)->pluck('id');
        $this->assertEquals($expect, $contents->pluck('id'));
    }

    public function testShowOnly()
    {
        $id = $this->user()->id;
        $this->beGlobalAdmin();
        $response = $this->get("/api/v1/export/users?only={$id}")->assertStatus(200);

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('users.json')));
        $this->assertEquals(collect([$id]), $contents->pluck('id'));
    }

    public function testIsAllowed()
    {
        config(['sync.allowed_exports' => ['volumes', 'labelTrees']]);
        $this->beGlobalAdmin();
        $response = $this->get('/api/v1/export/users')->assertStatus(404);
    }
}
