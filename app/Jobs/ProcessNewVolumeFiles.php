<?php

namespace Biigle\Jobs;

use Biigle\Video;
use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessNewVolumeFiles extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The volume for which the files should be processed.
     *
     * @var Volume
     */
    protected $volume;

    /**
     * Array of image/video IDs to restrict processing to.
     * If it is empty, all files of the volume will be taken.
     *
     * @var array
     */
    protected $only;

    /**
     * Ignore this job if the volume does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume The volume for which the files should be processed.
     * @param array $only (optional) Array of image/video IDs to restrict processing to.
     * If it is empty, all files of the volume will be taken.
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
        if ($this->volume->isImageVolume()) {
            $this->volume->images()
                ->when($this->only, fn ($query) => $query->whereIn('id', $this->only))
                ->eachById([ProcessNewImage::class, 'dispatch']);
        } else {
            $queue = config('videos.process_new_video_queue');
            $this->volume->videos()
                ->when($this->only, fn ($query) => $query->whereIn('id', $this->only))
                ->eachById(fn (Video $v) => ProcessNewVideo::dispatch($v)->onQueue($queue));
        }
    }
}
