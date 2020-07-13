<?php

namespace Biigle\Modules\Sync\Jobs;

use Biigle\Annotation;
use Biigle\Jobs\Job;
use Biigle\Jobs\ProcessNewImages;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;
use Biigle\Modules\Largo\LargoServiceProvider;
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
            ProcessNewImages::dispatch($volume);
        });

        if (class_exists(LargoServiceProvider::class)) {
            Annotation::join('images', 'images.id', '=', 'annotations.image_id')
                ->whereIn('images.volume_id', $this->ids)
                ->select('annotations.id')
                ->chunkById(1000, function ($annotations) {
                    foreach ($annotations as $annotation) {
                        GenerateAnnotationPatch::dispatch($annotation)
                            ->onQueue(config('largo.generate_annotation_patch_queue'));
                    }
                }, 'annotations.id', 'id');
        }
    }
}
