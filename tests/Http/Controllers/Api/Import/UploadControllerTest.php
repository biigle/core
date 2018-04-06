<?php

namespace Biigle\Tests\Modules\Sync\Http\Controllers\Api\Import;

use Mockery;
use Exception;
use ApiTestCase;
use Biigle\Tests\UserTest;
use Illuminate\Http\UploadedFile;
use Biigle\Modules\Sync\Support\Export\UserExport;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;

class UploadControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $mock = Mockery::mock(ArchiveManager::class);
        $mock->shouldReceive('store')->once()->andReturn('123abc');
        $this->app->bind(ArchiveManager::class, function () use ($mock) {
            return $mock;
        });

        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();

        $wrongFile = new UploadedFile($path, 'file.txt', 0, 'text/plain', null, true);
        $file = new UploadedFile($path, 'biigle_user_export.zip', filesize($path), 'application/zip', null, true);

        $this->doTestApiRoute('POST', '/api/v1/import');

        $this->beAdmin();
        $this->post('/api/v1/import')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->json('POST', '/api/v1/import')->assertStatus(422);

        $this->json('POST', '/api/v1/import', [], [], ['archive' => $wrongFile])
            ->assertStatus(422);

        $this->call('POST', '/api/v1/import', [], [], ['archive' => $file])
            ->assertStatus(302)
            ->assertRedirect('admin/import/123abc');
    }

    public function testStoreInvalid()
    {
        $mock = Mockery::mock(ArchiveManager::class);
        $e = new Exception('my error message');
        $mock->shouldReceive('store')->once()->andThrow($e);
        $this->app->bind(ArchiveManager::class, function () use ($mock) {
            return $mock;
        });

        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();
        $file = new UploadedFile($path, 'biigle_user_export.zip', filesize($path), 'application/zip', null, true);

        $this->beGlobalAdmin();
        $this->json('POST', '/api/v1/import', ['archive' => $file])
            ->assertStatus(422);
    }
}
