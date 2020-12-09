<?php

namespace Biigle\Modules\Sync\Jobs;

use Biigle\ImageAnnotation;
use Biigle\VideoAnnotation;
use Biigle\Jobs\Job;
use Biigle\Jobs\ProcessNewVolumeFiles;
use Biigle\Modules\Largo\Jobs\GenerateImageAnnotationPatch;
use Biigle\Modules\Largo\Jobs\GenerateVideoAnnotationPatch;
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

        if (class_exists(GenerateImageAnnotationPatch::class)) {
            ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
                ->whereIn('images.volume_id', $this->ids)
                ->select('image_annotations.id')
                ->eachById(function ($annotation) {
                    GenerateImageAnnotationPatch::dispatch($annotation)
                        ->onQueue(config('largo.generate_annotation_patch_queue'));
                }, 1000, 'image_annotations.id', 'id');
        }

        if (class_exists(GenerateVideoAnnotationPatch::class)) {
            VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
                ->whereIn('videos.volume_id', $this->ids)
                ->select('video_annotations.id')
                ->eachById(function ($annotation) {
                    GenerateVideoAnnotationPatch::dispatch($annotation)
                        ->onQueue(config('largo.generate_annotation_patch_queue'));
                }, 1000, 'video_annotations.id', 'id');
        }
    }
}
