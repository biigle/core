<?php

namespace Biigle\Jobs;

use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Jobs\GenerateImageAnnotationPatch;
use Biigle\Modules\Largo\Jobs\GenerateVideoAnnotationPatch;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class PostProcessingVolumeCloning extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Cloned volume to post process.
     *
     * @var Volume
     */
    protected $volume;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume
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
    public function handle(): void
    {
        $volume = $this->volume;

        ProcessNewVolumeFiles::dispatch($volume);

        if (class_exists(GenerateImageAnnotationPatch::class)) {
            ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
                ->where('images.volume_id', "=", $volume->id)
                ->select('image_annotations.id')
                ->eachById(function ($annotation) {
                    GenerateImageAnnotationPatch::dispatch($annotation)
                        ->onQueue(config('largo.generate_annotation_patch_queue'));
                }, 1000, 'image_annotations.id', 'id');
        }

        if (class_exists(GenerateVideoAnnotationPatch::class)) {
            VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
                ->where('videos.volume_id', "=", $volume->id)
                ->select('video_annotations.id')
                ->eachById(function ($annotation) {
                    GenerateVideoAnnotationPatch::dispatch($annotation)
                        ->onQueue(config('largo.generate_annotation_patch_queue'));
                }, 1000, 'video_annotations.id', 'id');
        }
    }

}
