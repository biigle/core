<?php

namespace Biigle\Tests\Http\Controllers\Api\Import;

use ApiTestCase;
use Biigle\Project;
use Biigle\Services\Export\UserExport;
use Biigle\Services\Import\ArchiveManager;
use Biigle\Services\Import\LabelTreeImport;
use Biigle\Services\Import\UserImport;
use Biigle\Services\Import\VolumeImport;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\UserTest;
use Biigle\User;
use Exception;
use Illuminate\Http\UploadedFile;
use Mockery;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ImportControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $mock = Mockery::mock(ArchiveManager::class);
        $mock->shouldReceive('store')->once()->andReturn('123abc');
        $this->app->bind(ArchiveManager::class, fn () => $mock);

        $user = UserTest::create();
        $path = (new UserExport([$user->id]))->getArchive();

        $wrongFile = UploadedFile::fake()->create('file.txt', 10, 'text/plain');
        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);

        $this->doTestApiRoute('POST', '/api/v1/import');

        $this->beAdmin();
        $this->post('/api/v1/import')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->json('POST', '/api/v1/import')->assertStatus(422);

        $this->json('POST', '/api/v1/import', ['archive' => $wrongFile])
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
        $this->app->bind(ArchiveManager::class, fn () => $mock);

        $export = new UserExport([$this->user()->id]);
        $path = $export->getArchive();
        $file = new UploadedFile($path, 'biigle_user_export.zip', 'application/zip', null, true);

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
        $this->app->bind(ArchiveManager::class, fn () => $managerMock);

        $this->doTestApiRoute('PUT', '/api/v1/import/abc123');

        $this->beAdmin();
        $this->put('/api/v1/import/abc123')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->put('/api/v1/import/abc123')->assertStatus(404);
        $this->put('/api/v1/import/abc123')->assertStatus(200);
    }

    public function testUpdateUserImport()
    {
        $this->makeImportMock(UserImport::class)->shouldReceive('perform')->once();
        $this->beGlobalAdmin();
        $this->put('/api/v1/import/abc123')->assertStatus(200);
    }

    public function testUpdateUserImportOnly()
    {
        $this->makeImportMock(UserImport::class)
            ->shouldReceive('perform')
            ->once()
            ->with([1, 2, 3]);

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123', ['only' => 'abc'])->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['only' => ['a']])->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['only' => [1, 2, 3]])->assertStatus(200);
    }

    public function testUpdateUserImportConflicts()
    {
        $this->makeImportMock(UserImport::class, 'abc123', false)
            ->shouldReceive('perform')
            ->once()
            ->andThrow(new UnprocessableEntityHttpException);

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123')->assertStatus(422);
    }

    public function testUpdateLabelTreeImport()
    {
        $this->makeImportMock(LabelTreeImport::class)->shouldReceive('perform')->once();

        $this->beGlobalAdmin();
        $this->put('/api/v1/import/abc123')->assertStatus(200);
    }

    public function testUpdateLabelTreeImportOnlyLabelTrees()
    {
        $this->makeImportMock(LabelTreeImport::class)
            ->shouldReceive('perform')
            ->once()
            ->with([1, 2, 3], null, [], []);

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
        $this->makeImportMock(LabelTreeImport::class)
            ->shouldReceive('perform')
            ->once()
            ->with(null, [1, 2, 3], [], []);

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
        $this->makeImportMock(LabelTreeImport::class)
            ->shouldReceive('perform')
            ->once()
            ->with(null, null, [1 => 'import', 2 => 'existing'], []);

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123', ['name_conflicts' => 'abc'])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['name_conflicts' => [1 => 'a']])
            ->assertStatus(422);
        $this
            ->putJson('/api/v1/import/abc123', [
                'name_conflicts' => [1 => 'import', 2 => 'existing'],
            ])
            ->assertStatus(200);
    }

    public function testUpdateLabelTreeImportConflictingParents()
    {
        $this->makeImportMock(LabelTreeImport::class)
            ->shouldReceive('perform')
            ->once()
            ->with(null, null, [], [1 => 'import', 2 => 'existing']);

        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123', ['parent_conflicts' => 'abc'])
            ->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['parent_conflicts' => [1 => 'a']])
            ->assertStatus(422);
        $this
            ->putJson('/api/v1/import/abc123', [
                'parent_conflicts' => [1 => 'import', 2 => 'existing'],
            ])
            ->assertStatus(200);
    }

    public function testUpdateVolumeImport()
    {
        $this->makeImportMock(VolumeImport::class)->shouldReceive('perform')->once();
        $this->beGlobalAdmin();
        $this->putJson('/api/v1/import/abc123')->assertStatus(422);
        $this->putJson('/api/v1/import/abc123', ['project_id' => 99])
            ->assertStatus(422);
        $p = ProjectTest::create();
        $this->putJson('/api/v1/import/abc123', ['project_id' => $p->id])
            ->assertStatus(200);
    }

    public function testUpdateVolumeImportOnlyVolumes()
    {
        $this->makeImportMock(VolumeImport::class)
            ->shouldReceive('perform')
            ->once()
            ->with(Mockery::type(Project::class), Mockery::type(User::class), [1, 2, 3], [], [], []);

        $this->beGlobalAdmin();
        $p = ProjectTest::create();
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'only' => 'abc',
            ])
            ->assertStatus(422);
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'only' => ['a'],
            ])
            ->assertStatus(422);
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'only' => [1, 2, 3],
            ])
            ->assertStatus(200);
    }

    public function testUpdateVolumeImportConflictingNames()
    {
        $this->makeImportMock(VolumeImport::class)
            ->shouldReceive('perform')
            ->once()
            ->with(Mockery::type(Project::class), Mockery::type(User::class), null, [], [1 => 'existing'], []);

        $this->beGlobalAdmin();
        $p = ProjectTest::create();
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'name_conflicts' => 'abc',
            ])
            ->assertStatus(422);
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'name_conflicts' => ['a'],
            ])
            ->assertStatus(422);
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'name_conflicts' => [1 => 'existing'],
            ])
            ->assertStatus(200);
    }

    public function testUpdateVolumeImportConflictingParents()
    {
        $this->makeImportMock(VolumeImport::class)
            ->shouldReceive('perform')
            ->once()
            ->with(Mockery::type(Project::class), Mockery::type(User::class), null, [], [], [1 => 'existing']);

        $this->beGlobalAdmin();
        $p = ProjectTest::create();
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'parent_conflicts' => 'abc',
            ])
            ->assertStatus(422);
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'parent_conflicts' => ['a'],
            ])
            ->assertStatus(422);
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'parent_conflicts' => [1 => 'existing'],
            ])
            ->assertStatus(200);
    }

    public function testUpdateVolumeImportNewVolumeUrls()
    {
        $this->makeImportMock(VolumeImport::class)
            ->shouldReceive('perform')
            ->once()
            ->with(Mockery::type(Project::class), Mockery::type(User::class), null, [0 => 'a'], [], []);

        $this->beGlobalAdmin();
        $p = ProjectTest::create();
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'new_urls' => 'abc',
            ])
            ->assertStatus(422);
        $this
            ->putJson('/api/v1/import/abc123', [
                'project_id' => $p->id,
                'new_urls' => ['a'],
            ])
            ->assertStatus(200);
    }

    public function testDestroy()
    {
        $mock = Mockery::mock(ArchiveManager::class);
        $mock->shouldReceive('has')->twice()->with('abc123')->andReturn(false, true);
        $mock->shouldReceive('delete')->once()->with('abc123');
        $this->app->bind(ArchiveManager::class, fn () => $mock);

        $this->doTestApiRoute('DELETE', '/api/v1/import/abc123');

        $this->beAdmin();
        $this->delete('/api/v1/import/abc123')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->delete('/api/v1/import/abc123')->assertStatus(404);

        $this->delete('/api/v1/import/abc123')
            ->assertStatus(302)
            ->assertRedirect('admin/import');
    }

    protected function makeImportMock($class, $token = 'abc123', $delete = true)
    {
        $importMock = Mockery::mock($class);
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('get')->with($token)->andReturn($importMock);
        if ($delete) {
            $managerMock->shouldReceive('delete')->once();
        }
        $this->app->bind(ArchiveManager::class, fn () => $managerMock);

        return $importMock;
    }
}
