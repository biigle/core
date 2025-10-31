<?php

namespace Biigle\Listeners;

use Biigle\Events\VolumeCloned;
use Biigle\Jobs\ProcessAnnotatedImage;
use Biigle\Jobs\ProcessAnnotatedVideo;

class VolumeClonedListener
{
    public function handle(VolumeCloned $event): void
    {
        // Give the ProcessCloneVolumeFiles job (from CloneImagesOrVideos) a head start so
        // the file thumbnails are generated (mostly) before the annotation thumbnails.
        $delay = now()->addSeconds(30);

        $event->volume->images()
            ->whereHas('annotations')
            ->eachById(function ($image) use ($delay) {
                ProcessAnnotatedImage::dispatch($image)
                    ->delay($delay)
                    ->onQueue(config('largo.generate_annotation_patch_queue'));
            });

        $event->volume->videos()
            ->whereHas('annotations')
            ->eachById(function ($video) use ($delay) {
                ProcessAnnotatedVideo::dispatch($video)
                    ->delay($delay)
                    ->onQueue(config('largo.generate_annotation_patch_queue'));
            });
    }
}
