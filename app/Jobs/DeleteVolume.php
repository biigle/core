<?php

namespace Biigle\Jobs;

use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\SerializesModels;

class DeleteVolume extends Job implements ShouldQueue
{
    use SerializesModels;

    /**
     * The volume that should be deleted.
     *
     * @var Volume
     */
    public $volume;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume The volume that should be deleted.
     *
     * @return void
     */
    public function __construct(Volume $volume)
    {
        $this->volume = $volume;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        // This is done in a queued job because it can take some time if the volume has
        // many images, videos and/or annotations. This should not stall the HTTP
        // request of the user.
        $this->volume->delete();
    }
}
