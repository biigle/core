<?php

namespace Biigle\Tests\Jobs;

use Biigle\Jobs\GenerateVolumeExportJob;
use Biigle\Notifications\VolumeExportReady;
use Biigle\User;
use Biigle\VolumeExport;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Mockery\Expectation;
use RuntimeException;
use SplFileInfo;
use TestCase;

class GenerateVolumeExportJobTest extends TestCase
{
    public function testHandleStoresArchiveAndNotifiesRequester(): void
    {
        Storage::fake('volume-exports');
        Notification::fake();
        config(['sync.volume_export_storage_disk' => 'volume-exports']);
        $user = User::factory()->create();
        $export = new VolumeExport;
        $export->user()->associate($user);
        $export->volume_ids = [];
        $export->save();

        (new GenerateVolumeExportJob($export))->handle();

        Storage::disk('volume-exports')->assertExists("{$export->id}.zip");
        $this->assertNotNull($export->fresh()->ready_at);
        Notification::assertSentTo($user, VolumeExportReady::class);
    }

    public function testHandleStopsIfExportWasDeleted(): void
    {
        Storage::fake('volume-exports');
        Notification::fake();
        config(['sync.volume_export_storage_disk' => 'volume-exports']);
        $export = new VolumeExport;
        $export->user()->associate(User::factory()->create());
        $export->volume_ids = [];
        $export->save();
        $export->delete();

        (new GenerateVolumeExportJob($export))->handle();

        Storage::disk('volume-exports')->assertDirectoryEmpty('/');
        Notification::assertNothingSent();
    }

    public function testHandleRemovesArchiveIfExportIsDeletedWhileStoring(): void
    {
        Notification::fake();
        config(['sync.volume_export_storage_disk' => 'volume-exports']);
        $export = new VolumeExport;
        $export->user()->associate(User::factory()->create());
        $export->volume_ids = [];
        $export->save();
        $path = null;
        $disk = Mockery::mock(Filesystem::class);
        /** @var Expectation $put */
        $put = $disk->shouldReceive('putFileAs');
        $put->once()
            ->andReturnUsing(function ($directory, SplFileInfo $file, $filename) use ($export, &$path) {
                $path = $file->getPathname();
                $export->delete();

                return $filename;
            });
        /** @var Expectation $delete */
        $delete = $disk->shouldReceive('delete');
        $delete->atLeast()->once()->with("{$export->id}.zip");
        Storage::shouldReceive('disk')->andReturn($disk);

        (new GenerateVolumeExportJob($export))->handle();

        $this->assertDatabaseMissing('volume_exports', ['id' => $export->id]);
        $this->assertFileDoesNotExist($path);
        Notification::assertNothingSent();
    }

    public function testHandleCleansTemporaryArchiveIfStorageFails(): void
    {
        Notification::fake();
        config(['sync.volume_export_storage_disk' => 'volume-exports']);
        $export = new VolumeExport;
        $export->user()->associate(User::factory()->create());
        $export->volume_ids = [];
        $export->save();
        $path = null;
        $disk = Mockery::mock(Filesystem::class);
        /** @var Expectation $put */
        $put = $disk->shouldReceive('putFileAs');
        $put->once()
            ->andReturnUsing(function ($directory, SplFileInfo $file) use (&$path) {
                $path = $file->getPathname();

                return false;
            });
        Storage::shouldReceive('disk')->once()->andReturn($disk);

        try {
            (new GenerateVolumeExportJob($export))->handle();
            $this->fail('Storage failure did not fail the job.');
        } catch (RuntimeException) {
            // Expected.
        }

        $this->assertFileDoesNotExist($path);
        $this->assertNull($export->fresh()->ready_at);
        Notification::assertNothingSent();
    }

    public function testHandleRetryKeepsReadyArchiveAndRetriesNotification(): void
    {
        Storage::fake('volume-exports');
        Notification::fake();
        config(['sync.volume_export_storage_disk' => 'volume-exports']);
        $user = User::factory()->create();
        $export = new VolumeExport;
        $export->user()->associate($user);
        $export->volume_ids = [];
        $export->ready_at = now();
        $export->save();
        Storage::disk('volume-exports')->put("{$export->id}.zip", 'archive');

        (new GenerateVolumeExportJob($export))->handle();

        Storage::disk('volume-exports')->assertExists("{$export->id}.zip");
        Notification::assertSentTo($user, VolumeExportReady::class);
    }

    public function testHandleCleansTemporaryArchiveIfStorageDiskFails(): void
    {
        Notification::fake();
        $directory = sys_get_temp_dir().'/biigle-volume-export-'.uniqid();
        mkdir($directory);
        config([
            'sync.tmp_storage' => $directory,
            'sync.volume_export_storage_disk' => 'volume-exports',
        ]);
        $export = new VolumeExport;
        $export->user()->associate(User::factory()->create());
        $export->volume_ids = [];
        $export->save();
        Storage::shouldReceive('disk')->once()->andThrow(new RuntimeException);

        try {
            (new GenerateVolumeExportJob($export))->handle();
            $this->fail('Storage disk failure did not fail the job.');
        } catch (RuntimeException) {
            // Expected.
        }

        $files = glob("{$directory}/*");
        array_map('unlink', $files);
        rmdir($directory);
        $this->assertEmpty($files);
        $this->assertNull($export->fresh()->ready_at);
        Notification::assertNothingSent();
    }
}
