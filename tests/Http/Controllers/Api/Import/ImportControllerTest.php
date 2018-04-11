<?php

namespace Biigle\Tests\Modules\Sync\Http\Controllers\Api\Import;

use Mockery;
use Exception;
use ApiTestCase;
use Biigle\Tests\UserTest;
use Illuminate\Http\UploadedFile;
use Biigle\Modules\Sync\Support\Export\UserExport;
use Biigle\Modules\Sync\Support\Import\UserImport;
use Biigle\Modules\Sync\Support\Import\VolumeImport;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;
use Biigle\Modules\Sync\Support\Import\LabelTreeImport;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ImportControllerTest extends ApiTestCase
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

    public function testUpdate()
    {
        $importMock = Mockery::mock(UserImport::class);
        $importMock->shouldReceive('perform')->once();
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')
            ->twice()
            ->with('abc123')
            ->andReturn(null, $importMock);
        $managerMock->shouldReceive('delete')->once();
        $this->app->bind(ArchiveManager::class, function () use ($managerMock) {
            return $managerMock;
        });

        $this->doTestApiRoute('PUT', '/api/v1/import/abc123');

        $this->beAdmin();
        $this->put('/api/v1/import/abc123')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->put('/api/v1/import/abc123')->assertStatus(404);
        $this->put('/api/v1/import/abc123')->assertStatus(200);
    }

    public function testUpdateUserImport()
    {
        $importMock = Mockery::mock(UserImport::class);
        $importMock->shouldReceive('perform')->once();
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')->with('abc123')->andReturn($importMock);
        $managerMock->shouldReceive('delete')->once();
        $this->app->bind(ArchiveManager::class, function () use ($managerMock) {
            return $managerMock;
        });

        $this->beGlobalAdmin();
        $this->put('/api/v1/import/abc123')->assertStatus(200);
    }

    public function testUpdateUserImportOnly()
    {
        $importMock = Mockery::mock(UserImport::class);
        $importMock->shouldReceive('perform')->once()->with([1, 2, 3]);
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')->with('abc123')->andReturn($importMock);
        $managerMock->shouldReceive('delete')->once();
        $this->app->bind(ArchiveManager::class, function () use ($managerMock) {
            return $managerMock;
        });

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123', ['only' => 'abc'])->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['only' => ['a']])->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['only' => [1, 2, 3]])->assertStatus(200);
    }

    public function testUpdateUserImportConflicts()
    {
        $importMock = Mockery::mock(UserImport::class);
        $importMock->shouldReceive('perform')->once()->andThrow(new UnprocessableEntityHttpException);
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')->with('abc123')->andReturn($importMock);
        $managerMock->shouldReceive('delete')->never();
        $this->app->bind(ArchiveManager::class, function () use ($managerMock) {
            return $managerMock;
        });

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123')->assertStatus(422);
    }

    public function testUpdateLabelTreeImport()
    {
        $importMock = Mockery::mock(LabelTreeImport::class);
        $importMock->shouldReceive('perform')->once();
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')->with('abc123')->andReturn($importMock);
        $managerMock->shouldReceive('delete')->once();
        $this->app->bind(ArchiveManager::class, function () use ($managerMock) {
            return $managerMock;
        });

        $this->beGlobalAdmin();
        $this->put('/api/v1/import/abc123')->assertStatus(200);
    }

    public function testUpdateLabelTreeImportOnlyLabelTrees()
    {
        $importMock = Mockery::mock(LabelTreeImport::class);
        $importMock->shouldReceive('perform')->once()->with([1, 2, 3], null, [], []);
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')->with('abc123')->andReturn($importMock);
        $managerMock->shouldReceive('delete')->once();
        $this->app->bind(ArchiveManager::class, function () use ($managerMock) {
            return $managerMock;
        });

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123', ['only_label_trees' => 'abc'])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['only_label_trees' => ['a']])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['only_label_trees' => [1, 2, 3]])
            ->assertStatus(200);
    }

    public function testUpdateLabelTreeImportOnlyLabels()
    {
        $importMock = Mockery::mock(LabelTreeImport::class);
        $importMock->shouldReceive('perform')->once()->with(null, [1, 2, 3], [], []);
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')->with('abc123')->andReturn($importMock);
        $managerMock->shouldReceive('delete')->once();
        $this->app->bind(ArchiveManager::class, function () use ($managerMock) {
            return $managerMock;
        });

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123', ['only_labels' => 'abc'])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['only_labels' => ['a']])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['only_labels' => [1, 2, 3]])
            ->assertStatus(200);
    }

    public function testUpdateLabelTreeImportConflictingNames()
    {
        $importMock = Mockery::mock(LabelTreeImport::class);
        $importMock->shouldReceive('perform')
            ->once()
            ->with(null, null, [1 => 'import', 2 => 'existing'], []);
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')->with('abc123')->andReturn($importMock);
        $managerMock->shouldReceive('delete')->once();
        $this->app->bind(ArchiveManager::class, function () use ($managerMock) {
            return $managerMock;
        });

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123', ['name_conflicts' => 'abc'])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['name_conflicts' => [1 => 'a']])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', [
                'name_conflicts' => [1 => 'import', 2 => 'existing'],
            ])
            ->assertStatus(200);
    }

    public function testUpdateLabelTreeImportConflictingParents()
    {
        $importMock = Mockery::mock(LabelTreeImport::class);
        $importMock->shouldReceive('perform')
            ->once()
            ->with(null, null, [], [1 => 'import', 2 => 'existing']);
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')->with('abc123')->andReturn($importMock);
        $managerMock->shouldReceive('delete')->once();
        $this->app->bind(ArchiveManager::class, function () use ($managerMock) {
            return $managerMock;
        });

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123', ['parent_conflicts' => 'abc'])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['parent_conflicts' => [1 => 'a']])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', [
                'parent_conflicts' => [1 => 'import', 2 => 'existing'],
            ])
            ->assertStatus(200);
    }

    public function testDestroy()
    {
        $mock = Mockery::mock(ArchiveManager::class);
        $mock->shouldReceive('has')->twice()->with('abc123')->andReturn(false, true);
        $mock->shouldReceive('delete')->once()->with('abc123');
        $this->app->bind(ArchiveManager::class, function () use ($mock) {
            return $mock;
        });

        $this->doTestApiRoute('DELETE', '/api/v1/import/abc123');

        $this->beAdmin();
        $this->delete('/api/v1/import/abc123')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->delete('/api/v1/import/abc123')->assertStatus(404);

        $this->delete('/api/v1/import/abc123')
            ->assertStatus(302)
            ->assertRedirect('admin/import');
    }
}
