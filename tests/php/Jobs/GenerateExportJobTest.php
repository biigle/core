<?php

namespace Biigle\Tests\Jobs;

use Biigle\ExportFile;
use Biigle\Jobs\GenerateExportJob;
use Biigle\Notifications\ExportReady;
use Biigle\User;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use TestCase;

class GenerateExportJobTest extends TestCase
{
    public function testHandle()
    {
        Storage::fake('exports');
        Notification::fake();
        $user = User::factory()->create();
        $export = $this->createExport($user);

        (new GenerateExportJob($export))->handle();

        Storage::disk('exports')->assertExists("{$export->id}.zip");
        $this->assertNotNull($export->fresh()->ready_at);
        Notification::assertSentTo($user, ExportReady::class);
    }

    public function testHandleAlreadyReady()
    {
        Storage::fake('exports');
        Notification::fake();
        $export = $this->createExport(User::factory()->create(), now());

        (new GenerateExportJob($export))->handle();

        Storage::disk('exports')->assertMissing("{$export->id}.zip");
        Notification::assertNothingSent();
    }

    protected function createExport(User $user, $readyAt = null): ExportFile
    {
        $export = new ExportFile;
        $export->user()->associate($user);
        $export->type = 'users';
        $export->entity_ids = [$user->id];
        $export->ready_at = $readyAt;
        $export->save();

        return $export;
    }
}
