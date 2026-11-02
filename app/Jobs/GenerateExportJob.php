<?php

namespace Biigle\Jobs;

use Biigle\ExportFile;
use Biigle\Notifications\ExportReady;
use Carbon\Carbon;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

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
        if ($this->export->ready_at) {
            return;
        }

        $this->export->generate();
        $this->export->ready_at = new Carbon;
        $this->export->save();

        $this->export->user->notify(new ExportReady($this->export));
    }
}
