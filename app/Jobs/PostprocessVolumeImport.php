<?php

namespace Biigle\Jobs;

use Biigle\Image;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\Video;
use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Collection;

class PostprocessVolumeImport extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * IDs of the imported volumes.
     *
     * @var array
     */
    protected $ids;

    /**
     * Create a new job instance.
     *
     * @param Collection $volumes
     *
     * @return void
     */
    public function __construct(Collection $volumes)
    {
        $this->ids = $volumes->pluck('id')->toArray();
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        Volume::whereIn('id', $this->ids)->select('id')->each(function ($volume) {
            ProcessNewVolumeFiles::dispatch($volume);
        });

        // Give the ProcessNewVolumeFiles jobs a head start so the file thumbnails are
        // generated (mostly) before the annotation thumbnails.
        $delay = now()->addSeconds(30);

        if (class_exists(ProcessAnnotatedImage::class)) {
            Image::whereIn('images.volume_id', $this->ids)
                ->whereHas('annotations')
                ->eachById(function ($image) use ($delay) {
                    ProcessAnnotatedImage::dispatch($image)
                        ->delay($delay)
                        ->onQueue(config('largo.generate_annotation_patch_queue'));
                }, 1000);
        }

        if (class_exists(ProcessAnnotatedVideo::class)) {
            Video::whereIn('videos.volume_id', $this->ids)
                ->whereHas('annotations')
                ->eachById(function ($video) use ($delay) {
                    ProcessAnnotatedVideo::dispatch($video)
                        ->delay($delay)
                        ->onQueue(config('largo.generate_annotation_patch_queue'));
                }, 1000);
        }
    }
}
