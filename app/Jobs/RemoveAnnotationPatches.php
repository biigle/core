<?php

namespace Biigle\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Queue;

abstract class RemoveAnnotationPatches extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Map of the annotation ID to the image/video UUID of the annotation whose patch
     * should be removed.
     *
     * @var array
     */
    public $annotationIds;

    /**
     * Number of annotations to start chunking of this job.
     *
     * @var int
     */
    public $chunkSize;

    /**
     * Create a new job instance.
     *
     * @param array $annotationIds
     * @param int $chunkSize
     *
     * @return void
     */
    public function __construct(array $annotationIds, $chunkSize = 100)
    {
        $this->annotationIds = $annotationIds;
        $this->chunkSize = $chunkSize;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        if (count($this->annotationIds) > $this->chunkSize) {
            // Split this job into smaller chunks so each individual job has a
            // reasonable runtime.
            $this->submitChunkedJobs();
        } else {
            $this->deletePatches();
        }
    }

    /**
     * Submit more instances of this job that should process smaller chunks.
     */
    protected function submitChunkedJobs()
    {
        $chunks = array_chunk($this->annotationIds, $this->chunkSize, true);
        foreach ($chunks as $chunk) {
            Queue::push(new static($chunk, $this->chunkSize));
        }
    }

    /**
     * Delete the annotation patches.
     */
    abstract protected function deletePatches();
}
