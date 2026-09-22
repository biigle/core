<?php

namespace Biigle\Jobs;

use Biigle\Notifications\VolumeExportReady;
use Biigle\Services\Export\VolumeExport as VolumeExportGenerator;
use Biigle\VolumeExport;
use Carbon\Carbon;
use File;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use RuntimeException;
use SplFileInfo;
use Storage;

class GenerateVolumeExportJob extends Job
{
    use InteractsWithQueue, SerializesModels;

    /**
     * Delete the queued job if the export no longer exists.
     *
     * @var bool
     */
    public $deleteWhenMissingModels = true;

    /**
     * The export to generate.
     *
     * @var VolumeExport
     */
    public $export;

    /**
     * Create a new job instance.
     */
    public function __construct(VolumeExport $export)
    {
        $this->export = $export;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $export = $this->export->fresh();

        if (is_null($export)) {
            return;
        }

        $path = (new VolumeExportGenerator($export->volume_ids))->getArchive();
        $filename = $export->getStorageFilename();
        $disk = Storage::disk(config('sync.volume_export_storage_disk'));

        try {
            if (!$disk->putFileAs('', new SplFileInfo($path), $filename)) {
                throw new RuntimeException('Could not store volume export.');
            }
        } finally {
            File::delete($path);
        }

        $updated = VolumeExport::whereKey($export->id)
            ->whereNull('ready_at')
            ->update(['ready_at' => new Carbon]);

        if (!$updated) {
            $disk->delete($filename);

            return;
        }

        $export->user->notify(new VolumeExportReady($export));
    }
}
