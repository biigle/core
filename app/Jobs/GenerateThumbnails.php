<?php

namespace Biigle\Jobs;

use DB;
use Biigle\Jobs\Job;
use Biigle\Transect;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateThumbnails extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The transect for which the thumbnails should be generated.
     *
     * @var Transect
     */
    private $transect;

    /**
     * Array of image IDs to restrict the generating of thumbnails to.
     * If it is empty, all images of the transect will be taken.
     *
     * @var array
     */
    private $only;

    /**
     * Create a new job instance.
     *
     * @param Transect $transect The transect for which the thumbnails should be generated.
     * @param array $only (optional) Array of image IDs to restrict the generating of thumbnails to. If it is empty, all images of the transect will be taken.
     *
     * @return void
     */
    public function __construct(Transect $transect, array $only = [])
    {
        $this->transect = $transect;
        $this->only = $only;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        app()->make('Biigle\Contracts\ThumbnailService')
            ->generateThumbnails($this->transect, $this->only);
    }
}
