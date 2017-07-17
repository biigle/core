<?php

namespace Biigle\Jobs;

use App;
use Biigle\Volume;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateThumbnails extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The volume for which the thumbnails should be generated.
     *
     * @var Volume
     */
    private $volume;

    /**
     * Array of image IDs to restrict the generating of thumbnails to.
     * If it is empty, all images of the volume will be taken.
     *
     * @var array
     */
    private $only;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume The volume for which the thumbnails should be generated.
     * @param array $only (optional) Array of image IDs to restrict the generating of thumbnails to. If it is empty, all images of the volume will be taken.
     *
     * @return void
     */
    public function __construct(Volume $volume, array $only = [])
    {
        $this->volume = $volume;
        $this->only = $only;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        App::make('Biigle\Contracts\ThumbnailService')
            ->generateThumbnails($this->volume, $this->only);
    }
}
