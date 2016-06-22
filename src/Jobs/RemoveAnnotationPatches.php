<?php

namespace Dias\Modules\Ate\Jobs;

use File;
use Dias\Jobs\Job;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class RemoveAnnotationPatches extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The transect ID of which the annotation patches should be removed
     *
     * @var int
     */
    private $transectId;

    /**
     * The annotation IDs whose patches should be removed
     *
     * @var array
     */
    private $annotationIds;

    /**
     * Create a new job instance.
     *
     * @param int $transectId
     * @param array $annotationIds
     *
     * @return void
     */
    public function __construct($transectId, array $annotationIds)
    {
        $this->transectId = $transectId;
        $this->annotationIds = $annotationIds;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $prefix = config('ate.patch_storage').'/'.$this->transectId;
        $format = config('ate.patch_format');

        // use a loop because this may be a massive amount of files
        foreach ($this->annotationIds as $id) {
            File::delete("{$prefix}/{$id}.{$format}");
        }

        if (empty(File::files($prefix))) {
            File::deleteDirectory($prefix);
        }
    }
}
