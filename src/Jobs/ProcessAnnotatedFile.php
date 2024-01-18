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
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Jcupitt\Vips\Image;
use Str;

abstract class ProcessAnnotatedFile extends GenerateFeatureVectors
{
    use SerializesModels, InteractsWithQueue;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Ignore this job if the annotation does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param VolumeFile $file The file to process.
     * @param array $only If filled with `\Biigle\Annotation` IDs belonging to the
     * file, only the annotations will be processed.
     * @param bool|boolean $generatePatches Enable generation of annotation patches.
     * @param bool|boolean $generateFeatureVectors Enable generation of annotation
     * feature vectors.
     * @param ?string $targetDisk The storage disk to store annotation patches to (
     * default is the configured `largo.patch_storage_disk`).
     */
    public function __construct(
        public VolumeFile $file,
        public array $only = [],
        public bool $generatePatches = true,
        public bool $generateFeatureVectors = true,
        public ?string $targetDisk = null
    )
    {
        $this->targetDisk = $targetDisk ?: config('largo.patch_storage_disk');
        // TODO: Validate that $only annotations belong to the file.
        // TODO: Implement/test flags to generate patches, FV
        // TODO: Test multiple annotations
        // TODO: Test $only annotations
        // TODO: Implement chunking of annotations, as a file can have a lot.
    }

    /**
     * Assemble the target path for an annotation patch.
     *
     * @param Annotation $annotation
     *
     * @return string
     */
    public static function getTargetPath(Annotation $annotation): string
    {
        $prefix = fragment_uuid_path($annotation->getFile()->uuid);
        $format = config('largo.patch_format');

        return match($annotation::class) {
            // Add "v-" to make absolutely sure that no collisions (same UUID, same ID)
            // occur because patches are stored on the same disk.
            VideoAnnotation::class => "{$prefix}/v-{$annotation->id}.{$format}",
            // This is the old patch storage scheme, so we don't add "i-" for backwards
            // compatibility.
            default => "{$prefix}/{$annotation->id}.{$format}",
        };
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            FileCache::get($this->file, [$this, 'handleFile'], true);
        } catch (FileLockedException $e) {
            // Retry this job without increasing the attempts if the file is currently
            // written by another worker. This worker can process other jobs in the
            // meantime.
            // See: https://github.com/laravel/ideas/issues/735
            static::dispatch(
                    $this->file,
                    $this->only,
                    $this->generatePatches,
                    $this->generateFeatureVectors,
                    $this->targetDisk
                )
                ->onConnection($this->connection)
                ->onQueue($this->queue)
                ->delay(60);
        } catch (Exception $e) {
            if ($this->shouldRetryAfterException($e)) {
                // Exponential backoff for retry after 10 and then 20 minutes.
                $this->release($this->attempts() * 600);
            } else {
                $class = get_class($this->file);
                Log::warning("Could not process annotated {$class} {$this->file->id}: {$e->getMessage()}", ['exception' => $e]);
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
     * Generates feature vectors for the specified annotations belonging to the file of
     * this job. This method either creates new feature vector models or updates the
     * existing ones for the annotations.
     *
     * @param Collection $annotation
     * @param array|string $filePath If a string, a file path to the local image to use for feature vector generation. If an array, a map of annotation IDs to a local image file path.
     */
    protected function generateFeatureVectors(Collection $annotations, array|string $filePath): void
    {
        $boxes = $this->generateFileInput($this->file, $annotations);

        if (empty($boxes)) {
            return;
        }

        $annotations = $annotations->load('labels.label')->keyBy('id');

        $inputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_input');
        $outputPath = tempnam(sys_get_temp_dir(), 'largo_feature_vector_output');

        try {
            if (is_array($filePath)) {
                $input = [];
                foreach ($boxes as $id => $box) {
                    $path = $filePath[$id];
                    if (array_key_exists($path, $input)) {
                        $input[$path][$id] = $box;
                    } else {
                        $input[$path] = [$id => $box];
                    }
                }
            } else {
                $input = [$filePath => $boxes];
            }

            File::put($inputPath, json_encode($input));
            $this->python($inputPath, $outputPath);

            foreach ($this->readOutputCsv($outputPath) as $row) {
                $annotation = $annotations->get($row[0]);

                foreach ($annotation->labels as $al) {
                    $this->updateOrCreateFeatureVector(
                        ['id' => $al->id],
                        [
                            'annotation_id' => $annotation->id,
                            'label_id' => $al->label_id,
                            'label_tree_id' => $al->label->label_tree_id,
                            'volume_id' => $this->file->volume_id,
                            'vector' => $row[1],
                        ]
                    );
                }
            }

        } finally {
            File::delete($outputPath);
            File::delete($inputPath);
        }
    }

    /**
     * Updates or creates a new feature vector model for the annotation of this job.
     */
    abstract protected function updateOrCreateFeatureVector(array $id, array $attributes): void;
}
