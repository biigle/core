<?php

namespace Biigle\Jobs;

use Biigle\VolumeExport;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateVolumeExportJob extends Job
{
    use InteractsWithQueue, SerializesModels;

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
        // Generation is implemented by the next volume-export ticket.
    }
}
