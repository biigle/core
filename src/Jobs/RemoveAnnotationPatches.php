<?php

namespace Biigle\Modules\Largo\Jobs;

use File;
use Biigle\Jobs\Job;
use FilesystemIterator;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class RemoveAnnotationPatches extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The volume ID of which the annotation patches should be removed.
     *
     * @var int
     */
    public $volumeId;

    /**
     * The annotation IDs whose patches should be removed.
     *
     * @var array
     */
    public $annotationIds;

    /**
     * Create a new job instance.
     *
     * @param int $volumeId
     * @param array $annotationIds
     *
     * @return void
     */
    public function __construct($volumeId, array $annotationIds)
    {
        $this->volumeId = $volumeId;
        $this->annotationIds = $annotationIds;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $prefix = config('largo.patch_storage').'/'.$this->volumeId;
        $format = config('largo.patch_format');

        // use a loop because this may be a massive amount of files
        // (the alternative would be array_map to assemble all file paths first)
        foreach ($this->annotationIds as $id) {
            File::delete("{$prefix}/{$id}.{$format}");
        }

        if (File::exists($prefix) && $this->dirIsEmpty($prefix)) {
            File::deleteDirectory($prefix);
        }
    }

    /**
     * Chack if a directory containing Largo patches is empty.
     *
     * @param string $path
     *
     * @return bool
     */
    protected function dirIsEmpty($path)
    {
        // If the iterator is not valid, there are no files in the directory any more.
        // Use the iterator because there may be *lots* of files in the directory
        // and most other methods fetch/count them all.
        return with(new FilesystemIterator($path))->valid() === false;
    }
}
