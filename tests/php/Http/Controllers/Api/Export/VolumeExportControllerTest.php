<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\Jobs\GenerateVolumeExportJob;
use Biigle\Tests\VolumeTest;
use Biigle\VolumeExport;
use Queue;

class VolumeExportControllerTest extends ApiTestCase
{
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
}
