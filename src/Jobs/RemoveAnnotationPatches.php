<?php

namespace Biigle\Modules\Largo\Jobs;

use Storage;
use Biigle\Jobs\Job;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class RemoveAnnotationPatches extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Map of the annotation ID to the image ID of the annotation whose patch should be removed.
     *
     * @var array
     */
    public $annotationIds;

    /**
     * Create a new job instance.
     *
     * @param array $annotationIds
     *
     * @return void
     */
    public function __construct(array $annotationIds)
    {
        $this->annotationIds = $annotationIds;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $disk = Storage::disk(config('largo.patch_storage_disk'));
        $format = config('largo.patch_format');

        foreach ($this->annotationIds as $id => $uuid) {
            $prefix = fragment_uuid_path($uuid);
            $disk->delete("{$prefix}/{$id}.{$format}");
        }
    }
}
