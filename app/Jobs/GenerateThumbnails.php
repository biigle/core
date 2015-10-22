<?php

namespace Dias\Jobs;

use DB;
use Dias\Jobs\Job;
use Dias\Transect;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Bus\SelfHandling;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateThumbnails extends Job implements SelfHandling, ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The transect for which the thumbnails should be generated.
     *
     * @var Transect
     */
    private $transect;

    /**
     * Create a new job instance.
     *
     * @param Transect $transect The transect for which the thumbnails should be generated.
     * @return void
     */
    public function __construct(Transect $transect)
    {
        $this->transect = $transect;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        // ensure a fresh DB connection because this job is run with the daemon queue worker
        DB::reconnect();
        app()->make('Dias\Contracts\ThumbnailService')->generateThumbnails($this->transect);
    }
}
