<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Contracts\Annotation;
use Biigle\FileCache\Exceptions\FileLockedException;
use Biigle\Modules\Largo\Traits\ComputesAnnotationBox;
use Biigle\Shape;
use Biigle\VideoAnnotation;
use Biigle\VolumeFile;
use Exception;
use FileCache;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Str;
use Jcupitt\Vips\Image;

abstract class GenerateAnnotationPatch extends GenerateFeatureVectors
{
    use SerializesModels, InteractsWithQueue;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

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
            FileCache::get($this->annotation->getFile(), [$this, 'handleFile'], true);
        } catch (FileLockedException $e) {
            // Retry this job without increasing the attempts if the file is currently
            // written by another worker. This worker can process other jobs in the
            // meantime.
            // See: https://github.com/laravel/ideas/issues/735
            static::dispatch($this->annotation, $this->targetDisk)
                ->onConnection($this->connection)
                ->onQueue($this->queue)
                ->delay(60);
        } catch (Exception $e) {
            if ($this->shouldRetryAfterException($e)) {
                // Exponential backoff for retry after 10 and then 20 minutes.
                $this->release($this->attempts() * 600);
            } else {
                $class = get_class($this->annotation);
                Log::warning("Could not generate annotation patch for {$class} {$this->annotation->id}: {$e->getMessage()}", ['exception' => $e]);
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
     * Assemble the target path for an annotation patch.
     *
     * @param Annotation $annotation
     *
     * @return string
     */
    protected function getTargetPath(Annotation $annotation): string
    {
        $prefix = fragment_uuid_path($annotation->getFile()->uuid);
        $format = config('largo.patch_format');

        if ($annotation instanceof VideoAnnotation) {
            // Add "v-" to make absolutely sure that no collisions (same UUID, same ID)
            // occur because patches are stored on the same disk.
            return "{$prefix}/v-{$annotation->id}.{$format}";
        }

        // This is the old patch storage scheme, so we don't add "i-" for backwards
        // compatibility.
        return "{$prefix}/{$annotation->id}.{$format}";
    }

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
        return $this->attempts() < $this->tries && (
            // The remote source might be available again after a while.
            Str::contains($message, 'The source resource could not be established') ||
            // This error presumably occurs due to worker concurrency.
            Str::contains($message, 'Impossible to create the root directory')
        );
    }

    /**
     * Get the annotation patch as buffer.
     *
     * @param Image $image
     * @param array $points
     * @param Shape $shape
     *
     * @return string
     */
    protected function getAnnotationPatch($image, $points, $shape)
    {
        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');

        if ($shape->id === Shape::wholeFrameId()) {
            $image = $image->resize(floatval($thumbWidth) / $image->width);
        } else {
            $padding = config('largo.patch_padding');
            $pointPadding = config('largo.point_padding');

            $box = $this->getAnnotationBoundingBox($points, $shape, $pointPadding, $padding);
            $box = $this->ensureBoxAspectRatio($box, $thumbWidth, $thumbHeight);
            $box = $this->makeBoxContained($box, $image->width, $image->height);

            $image = $image->crop(...$box)->resize(floatval($thumbWidth) / $box[2]);
        }

        return $image->writeToBuffer('.'.config('largo.patch_format'), [
            'Q' => 85,
            'strip' => true,
        ]);
    }

    /**
     * Generates a feature vector for the annotation of this job and either creates a new
     * feature vector model or updates the existing ones for the annotation.
     */
    protected function generateFeatureVector(VolumeFile $file, string $path): void
    {
        $boxes = $this->generateFileInput($file, collect([$this->annotation]));
        if (empty($boxes)) {
            return;
        }

        // shm is available because this will only be executed in a Docker container.
        // The files are small here so this should be a fast way for communication.
        // Input/output files are used to also allow larger use cases with thousands of
        // feature vectors (e.g. in biigle/maia).
        $inputPath = tempnam('/dev/shm', 'largo_feature_vector_input');
        $outputPath = tempnam('/dev/shm', 'largo_feature_vector_output');

        try {
            File::put($inputPath, json_encode([$path => $boxes]));
            $this->python($inputPath, $outputPath);
            $output = $this->readOuputCsv($outputPath)->current();

            $shouldUpdate = $this->getFeatureVectorQuery()->exists();
            if ($shouldUpdate) {
                $this->getFeatureVectorQuery()->update(['vector' => $output[1]]);
            } else {
                $annotationLabels = $this->annotation
                    ->labels()
                    ->orderBy('id', 'asc')
                    ->with('label')
                    ->get();

                foreach ($annotationLabels as $annotationLabel) {
                    $this->createFeatureVector([
                        'id' => $annotationLabel->id,
                        'annotation_id' => $this->annotation->id,
                        'label_id' => $annotationLabel->label_id,
                        'label_tree_id' => $annotationLabel->label->label_tree_id,
                        'volume_id' => $file->volume_id,
                        'vector' => $output[1],
                    ]);
                }
            }
        } finally {
            File::delete($outputPath);
            File::delete($inputPath);
        }
    }

    /**
     * Get a query for the feature vectors associated with the annotation of this job.
     */
    abstract protected function getFeatureVectorQuery(): Builder;

    /**
     * Create a new feature vector model for the annotation of this job.
     */
    abstract protected function createFeatureVector(array $attributes): void;
}
