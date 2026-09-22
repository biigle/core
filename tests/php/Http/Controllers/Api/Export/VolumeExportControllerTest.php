<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\Jobs\GenerateVolumeExportJob;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Biigle\User;
use Biigle\VolumeExport;
use Queue;
use Storage;

class VolumeExportControllerTest extends ApiTestCase
{
    public function testShowAuthorizationAndReadiness()
    {
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner);

        $this->doTestApiRoute('GET', "/api/v1/export/volumes/{$export->id}");

        $this->beAdmin();
        $this->getJson("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(403);

        $other = UserTest::create(['role_id' => Role::adminId()]);
        $this->be($other);
        $this->getJson("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(403);

        $this->be($owner);
        $this->getJson("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(404);
    }

    public function testShowDownloadsReadyExportRepeatedly()
    {
        config(['sync.volume_export_storage_disk' => 'test']);
        $disk = Storage::fake('test');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner, now());
        $content = str_repeat('archive', 2000);
        $disk->put($export->getStorageFilename(), $content);
        $this->be($owner);

        $this->get("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/zip')
            ->assertHeader('content-disposition', 'attachment; filename=biigle_volume_export.zip')
            ->assertStreamedContent($content);

        $this->get("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(200)
            ->assertStreamedContent($content);

        $disk->assertExists($export->getStorageFilename());
    }

    public function testShowReadyExportWithoutFileReturnsNotFound()
    {
        config(['sync.volume_export_storage_disk' => 'test']);
        Storage::fake('test');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner, now());
        $this->be($owner);

        $this->getJson("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(404);
    }

    public function testDestroyAuthorizationAndReadyExportCleanup()
    {
        config(['sync.volume_export_storage_disk' => 'test']);
        $disk = Storage::fake('test');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner, now());
        $disk->put($export->getStorageFilename(), 'archive');

        $this->doTestApiRoute('DELETE', "/api/v1/export/volumes/{$export->id}");

        $this->beAdmin();
        $this->deleteJson("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(403);

        $other = UserTest::create(['role_id' => Role::adminId()]);
        $this->be($other);
        $this->deleteJson("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(403);

        $this->be($owner);
        $this->deleteJson("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('volume_exports', ['id' => $export->id]);
        $disk->assertMissing($export->getStorageFilename());
    }

    public function testDestroyPendingExport()
    {
        config(['sync.volume_export_storage_disk' => 'test']);
        $disk = Storage::fake('test');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner);
        $this->be($owner);

        $this->deleteJson("/api/v1/export/volumes/{$export->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('volume_exports', ['id' => $export->id]);
        $disk->assertMissing($export->getStorageFilename());
    }

    public function testDeletingOwnerCleansUpExports()
    {
        config(['sync.volume_export_storage_disk' => 'test']);
        $disk = Storage::fake('test');
        $owner = $this->globalAdmin();
        $export = $this->createExport($owner, now());
        $disk->put($export->getStorageFilename(), 'archive');

        $owner->delete();

        $this->assertDatabaseMissing('volume_exports', ['id' => $export->id]);
        $disk->assertMissing($export->getStorageFilename());
    }

    public function testStoreAuthorization()
    {
        $this->doTestApiRoute('POST', '/api/v1/export/volumes');

        $this->beAdmin();
        $this->postJson('/api/v1/export/volumes', ['only' => [1]])
            ->assertStatus(403);
    }

    public function testStorePersistsRequest()
    {
        $volume = VolumeTest::create();
        VolumeTest::create();
        $user = $this->globalAdmin();
        $this->be($user);

        $this->postJson('/api/v1/export/volumes', [
            'description' => 'For migration',
            'only' => [$volume->id],
        ])
            ->assertStatus(201)
            ->assertJson([
                'user_id' => $user->id,
                'description' => 'For migration',
                'volume_ids' => [$volume->id],
                'ready_at' => null,
            ])
            ->assertJsonMissingPath('user');

        $export = VolumeExport::firstOrFail();
        $this->assertSame($user->id, $export->user_id);
        $this->assertSame('For migration', $export->description);
        $this->assertSame([$volume->id], $export->volume_ids);
        $this->assertNull($export->ready_at);
    }

    public function testStorePersistsExceptSelection()
    {
        $excluded = VolumeTest::create();
        $included = VolumeTest::create();
        $this->beGlobalAdmin();

        $this->postJson('/api/v1/export/volumes', [
            'except' => (string) $excluded->id,
        ])->assertStatus(201);

        $this->assertSame([$included->id], VolumeExport::firstOrFail()->volume_ids);
    }

    public function testStoreQueuesGeneration()
    {
        config(['sync.generate_volume_export_queue' => 'volume-exports']);
        $volume = VolumeTest::create();
        $this->beGlobalAdmin();

        $response = $this->postJson('/api/v1/export/volumes', [
            'only' => [$volume->id],
        ])->assertStatus(201);

        Queue::assertPushedOn('volume-exports', function (GenerateVolumeExportJob $job) use ($response) {
            $response->assertJson(['id' => $job->export->id]);

            return true;
        });
    }

    public function testStoreRejectsLongDescription()
    {
        $this->beGlobalAdmin();

        $this->postJson('/api/v1/export/volumes', [
            'description' => str_repeat('a', 256),
            'only' => [1],
        ])->assertStatus(422);

        $this->assertDatabaseCount('volume_exports', 0);
    }

    public function testStoreAllowsNoDescription()
    {
        $volume = VolumeTest::create();
        $this->beGlobalAdmin();

        $this->postJson('/api/v1/export/volumes', [
            'only' => [$volume->id],
        ])
            ->assertStatus(201)
            ->assertJson(['description' => null]);

        $this->assertNull(VolumeExport::firstOrFail()->description);
    }

    public function testStoreValidatesSelection()
    {
        $this->beGlobalAdmin();

        $this->postJson('/api/v1/export/volumes')->assertStatus(422);
        $this->postJson('/api/v1/export/volumes', ['only' => [1], 'except' => [1]])
            ->assertStatus(422);
        $this->postJson('/api/v1/export/volumes', ['only' => ','])->assertStatus(422);
        $this->postJson('/api/v1/export/volumes', ['only' => 'abc'])->assertStatus(422);
        $this->postJson('/api/v1/export/volumes', ['only' => 0])->assertStatus(422);
        $this->postJson('/api/v1/export/volumes', ['except' => ','])->assertStatus(422);
        $this->postJson('/api/v1/export/volumes', ['except' => 'abc'])->assertStatus(422);
        $this->postJson('/api/v1/export/volumes', ['except' => 0])->assertStatus(422);

        $this->assertDatabaseCount('volume_exports', 0);
        Queue::assertNothingPushed();
    }

    public function testStoreIsAllowed()
    {
        config(['sync.allowed_exports' => ['labelTrees', 'users']]);
        $this->beGlobalAdmin();

        $this->postJson('/api/v1/export/volumes', ['only' => [1]])
            ->assertStatus(404);

        $this->assertDatabaseCount('volume_exports', 0);
    }

    public function testGetDoesNotCreateExport()
    {
        $this->beGlobalAdmin();

        $this->getJson('/api/v1/export/volumes?only=1')
            ->assertStatus(405);

        $this->assertDatabaseCount('volume_exports', 0);
        Queue::assertNothingPushed();
    }

    private function createExport(User $owner, $readyAt = null): VolumeExport
    {
        $export = new VolumeExport;
        $export->user()->associate($owner);
        $export->volume_ids = [];
        $export->ready_at = $readyAt;
        $export->save();

        return $export;
    }
}
