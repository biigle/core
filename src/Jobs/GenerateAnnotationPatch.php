<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Contracts\Annotation;
use Biigle\Jobs\Job;
use Biigle\VolumeFile;
use Exception;
use FileCache;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Str;

abstract class GenerateAnnotationPatch extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The the annotation to generate a patch for.
     *
     * @var Annotation
     */
    protected $annotation;

    /**
     * The storage disk to store the annotation patches to.
     *
     * @var string
     */
    protected $targetDisk;

    /**
     * Ignore this job if the annotation does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param Annotation $annotation The the annotation to generate a patch for.
     * @param string|null $targetDisk The storage disk to store the annotation patches to.
     *
     * @return void
     */
    public function __construct(Annotation $annotation, $targetDisk = null)
    {
        $this->annotation = $annotation;
        $this->targetDisk = $targetDisk !== null
            ? $targetDisk
            : config('largo.patch_storage_disk');
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            FileCache::get($this->annotation->getFile(), [$this, 'handleFile']);
        } catch (Exception $e) {
            if ($this->shouldRetryAfterException($e)) {
                // Exponential backoff for retry after 10 and then 20 minutes.
                $this->release($this->attempts() * 600);
            } else {
                throw new Exception("Could not generate annotation patch for annotation {$this->annotationId}: {$e->getMessage()}");
            }
        }
    }

    /**
     * Handle a single file.
     *
     * @param VolumeFile $file
     * @param string $path Path to the cached file.
     */
    abstract public function handleFile(VolumeFile $file, $path);

    /**
     * Determine if this job should retry instead of fail after an exception
     *
     * @param Exception $e
     *
     * @return bool
     */
    protected function shouldRetryAfterException(Exception $e)
    {
        $message = $e->getMessage();
        return $this->attempts() < 3 && (
            // The remote source might be available again after a while.
            Str::contains($message, 'The source resource could not be established') ||
            // This error presumably occurs due to worker concurrency.
            Str::contains($message, 'Impossible to create the root directory')
        );
    }
}
