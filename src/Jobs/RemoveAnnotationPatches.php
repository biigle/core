<?php

namespace Biigle\Modules\Largo\Jobs;

use App;
use File;
use Biigle\Jobs\Job;
use FilesystemIterator;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class RemoveAnnotationPatches extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The volume ID of which the annotation patches should be removed
     *
     * @var int
     */
    private $volumeId;

    /**
     * The annotation IDs whose patches should be removed
     *
     * @var array
     */
    private $annotationIds;

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

        // If the iterator is not valid, there are no files in the directory any more.
        // Use the iterator because there may be *lots* of files in the directory
        // and most other methods fetch/count them all.
        if (File::exists($prefix) && !App::make(FilesystemIterator::class, [$prefix, null])->valid()) {
            File::deleteDirectory($prefix);
        }
    }
}
