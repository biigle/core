<?php

namespace Biigle\Jobs;

use Biigle\Volume;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\DispatchesJobs;

class ProcessNewImages extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels, DispatchesJobs;

    /**
     * The volume for which the images should be processed.
     *
     * @var Volume
     */
    protected $volume;

    /**
     * Array of image IDs to restrict processing to.
     * If it is empty, all images of the volume will be taken.
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
     * @param Volume $volume The volume for which the images should be processed.
     * @param array $only (optional) Array of image IDs to restrict processing to.
     * If it is empty, all images of the volume will be taken.
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
        $this->volume->images()
            ->select('id')
            ->when($this->only, function ($query) {
                return $query->whereIn('id', $this->only);
            })
            ->chunk(100, function ($images) {
                $this->dispatch(new ProcessNewImageChunk($images->pluck('id')));
            });
    }
}
