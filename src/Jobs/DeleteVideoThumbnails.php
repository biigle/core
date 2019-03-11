<?php

namespace Biigle\Modules\Videos\Jobs;

use Storage;
use Biigle\Jobs\Job;
use Biigle\Modules\Videos\Video;
use Illuminate\Contracts\Queue\ShouldQueue;

class DeleteVideoThumbnails extends Job implements ShouldQueue
{
    /**
     * UUID of the video to delete the thumbnails of.
     *
     * @var string
     */
    protected $uuid;

    /**
     * Create a new instance.
     *
     * @param Video $video The video of which the thumbnails should be deleted.
     */
    public function __construct(Video $video)
    {
        $this->uuid = $video->uuid;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        Storage::disk(config('videos.thumbnail_storage_disk'))
            ->deleteDirectory(fragment_uuid_path($this->uuid));
    }
}
