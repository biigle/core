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
        $this->getJson('/api/v1/export/users')->assertStatus(422);

        $id = $this->user()->id;
        $response = $this->get("/api/v1/export/users?only={$id}")
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/zip')
            ->assertHeader('content-disposition', 'attachment; filename=biigle_user_export.zip');

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('users.json')));
        $this->assertEquals(collect([$id]), $contents->pluck('id'));
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

    public function testShowOnlyAndExceptMutuallyExclusive()
    {
        $id = $this->user()->id;
        $this->beGlobalAdmin();
        $this->getJson("/api/v1/export/users?only={$id}&except={$id}")->assertStatus(422);
    }

    public function testShowInvalidFilter()
    {
        $this->beGlobalAdmin();
        $this->getJson('/api/v1/export/users?only=,')->assertStatus(422);
        $this->getJson('/api/v1/export/users?only=abc')->assertStatus(422);
        $this->getJson('/api/v1/export/users?only=0')->assertStatus(422);
        $this->getJson('/api/v1/export/users?except=,')->assertStatus(422);
        $this->getJson('/api/v1/export/users?except=abc')->assertStatus(422);
        $this->getJson('/api/v1/export/users?except=0')->assertStatus(422);
    }

    public function testShowOnlyArray()
    {
        $id = $this->user()->id;
        $this->beGlobalAdmin();
        $response = $this->get("/api/v1/export/users?only[]={$id}")->assertStatus(200);

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('users.json')));
        $this->assertEquals(collect([$id]), $contents->pluck('id'));
    }

    public function testShowExceptArray()
    {
        $id = $this->user()->id;
        $this->beGlobalAdmin();
        $response = $this->get("/api/v1/export/users?except[]={$id}")->assertStatus(200);

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('users.json')));
        $expect = User::where('id', '!=', $id)->pluck('id');
        $this->assertEquals($expect, $contents->pluck('id'));
    }

    public function testIsAllowed()
    {
        config(['sync.allowed_exports' => ['volumes', 'labelTrees']]);
        $this->beGlobalAdmin();
        $response = $this->get('/api/v1/export/users?only=1')->assertStatus(404);
    }
}
