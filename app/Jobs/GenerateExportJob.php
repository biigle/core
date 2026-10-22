<?php

namespace Biigle\Jobs;

use Biigle\ExportFile;
use Biigle\Notifications\ExportReady;
use Carbon\Carbon;
use File;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use RuntimeException;
use SplFileInfo;
use Storage;

class GenerateExportJob extends Job
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
     * @var ExportFile
     */
    public $export;

    /**
     * Create a new job instance.
     */
    public function __construct(ExportFile $export)
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

        if ($export->ready_at) {
            return;
        }

        $path = $export->getGenerator()->getArchive();
        $filename = $export->getStorageFilename();

        try {
            $disk = Storage::disk(config('sync.export_storage_disk'));

            if (!$disk->putFileAs('', new SplFileInfo($path), $filename)) {
                throw new RuntimeException('Could not store volume export.');
            }
        } finally {
            File::delete($path);
        }

        $updated = ExportFile::whereKey($export->id)
            ->whereNull('ready_at')
            ->update(['ready_at' => new Carbon]);

        if (!$updated) {
            $disk->delete($filename);

            return;
        }

        /** @var \Biigle\User $user */
        $user = $export->user;
        $user->notify(new ExportReady($export));
    }
}
