<?php

namespace Biigle\Modules\Largo\Listeners;

use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\Volume;

class VolumeClonedListener
{
    public function handle(Volume $volume): void
    {
        // Give the ProcessNewVolumeFiles job (from CloneImagesorVideos) a head start so
        // the file thumbnails are generated (mostly) before the annotation thumbnails.
        $delay = now()->addSeconds(30);

        $volume->images()
            ->whereHas('annotations')
            ->eachById(function ($image) use ($delay) {
                ProcessAnnotatedImage::dispatch($image)
                    ->delay($delay)
                    ->onQueue(config('largo.generate_annotation_patch_queue'));
            });

        $volume->videos()
            ->whereHas('annotations')
            ->eachById(function ($video) use ($delay) {
                ProcessAnnotatedVideo::dispatch($video)
                    ->delay($delay)
                    ->onQueue(config('largo.generate_annotation_patch_queue'));
            });
    }
}
