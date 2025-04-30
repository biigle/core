<?php

namespace Biigle\Modules\Largo\Console\Commands;

use Biigle\Annotation;
use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedFile;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\VideoAnnotation;
use Biigle\VolumeFile;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Storage;

class GenerateMissing extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'largo:generate-missing
        {--dry-run : Do not submit processing jobs to the queue}
        {--volume= : Check only this volume}
        {--skip-images : Do not check image annotations}
        {--skip-videos : Do not check video annotations}
        {--skip-vectors : Do not check feature vectors}
        {--skip-patches : Do not check annotation patches}
        {--skip-svgs : Do not check annotation SVGs}
        {--force : Do not check for missing data first}
        {--queue= : Submit processing jobs to this queue}
        {--chunk-size=10000 : Number of annotations to fetch at a single time during the loop}
        {--newer-than= : Only check annotations newer than this date}
        {--older-than= : Only check annotations older than this date}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate missing data for annotations.';

    /**
     * Queue to push process jobs to.
     */
    protected string $queue;

    /**
     * Whether to skip checking for missing patches.
     */
    protected bool $skipPatches;

    /**
     * Whether to skip checking for missing feature vectors.
     */
    protected bool $skipVectors;

    /**
     * Whether to skip checking for missing SVGs.
     */
    protected bool $skipSvgs;

    /**
     * Regenerate data without checking if it is missing.
     */
    protected bool $force;

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle()
    {
        $this->queue = $this->option('queue') ?: config('largo.generate_annotation_patch_queue');
        $this->skipPatches = $this->option('skip-patches');
        $this->skipVectors = $this->option('skip-vectors');
        $this->skipSvgs = $this->option('skip-svgs');
        $this->force = $this->option('force');

        if (!$this->option('skip-images')) {
            $this->handleImageAnnotations();
        }

        if (!$this->option('skip-videos')) {
            $this->handleVideoAnnotations();
        }

    }

    /**
     * Check image annnotation patches
     */
    protected function handleImageAnnotations(): void
    {
        $annotations = ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
            // Order by image ID first because we want to submit the annotations in
            // batches for each image.
            ->orderBy('image_annotations.image_id')
            ->orderBy('image_annotations.id')
            ->select('image_annotations.id', 'image_annotations.image_id')
            ->when($this->option('volume'), function ($query) {
                $query->where('images.volume_id', $this->option('volume'));
            })
            ->when($this->option('newer-than'), function ($query) {
                $query->where('image_annotations.created_at', '>', new Carbon($this->option('newer-than')));
            })
            ->when($this->option('older-than'), function ($query) {
                $query->where('image_annotations.created_at', '<', new Carbon($this->option('older-than')));
            })
            // Don't include this if force===true. This will make the job regenerate the
            // feature vector later.
            ->when(!$this->skipVectors && !$this->force, function ($query) {
                $query->leftJoin('image_annotation_label_feature_vectors', 'image_annotation_label_feature_vectors.annotation_id', '=', 'image_annotations.id')
                    ->addSelect('image_annotation_label_feature_vectors.id as vector_id');
            });

        $this->line("Image annotations");
        $this->handleAnnotations($annotations);
    }

    /**
     * Check video annnotation patches
     */
    protected function handleVideoAnnotations(): void
    {
        $annotations = VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
            // Order by video ID first because we want to submit the annotations in
            // batches for each video.
            ->orderBy('video_annotations.video_id')
            ->orderBy('video_annotations.id')
            ->select('video_annotations.id', 'video_annotations.video_id')
            ->when($this->option('volume'), function ($query) {
                $query->where('videos.volume_id', $this->option('volume'));
            })
            ->when($this->option('newer-than'), function ($query) {
                $query->where('video_annotations.created_at', '>', new Carbon($this->option('newer-than')));
            })
            ->when($this->option('older-than'), function ($query) {
                $query->where('video_annotations.created_at', '<', new Carbon($this->option('older-than')));
            })
            // Don't include this if force===true. This will make the job regenerate the
            // feature vector later.
            ->when(!$this->skipVectors && !$this->force, function ($query) {
                $query->leftJoin('video_annotation_label_feature_vectors', 'video_annotation_label_feature_vectors.annotation_id', '=', 'video_annotations.id')
                    ->addSelect('video_annotation_label_feature_vectors.id as vector_id');
            });

        $this->line("Video annotations");
        $this->handleAnnotations($annotations);
    }

    protected function handleAnnotations(Builder $annotations): void
    {
        $pushToQueue = !$this->option('dry-run');
        $storage = Storage::disk(config('largo.patch_storage_disk'));

        $count = 0;
        $jobCount = 0;
        $total = $annotations->count();
        $progress = $this->output->createProgressBar($total);
        $this->info("Checking {$total} annotations...");

        $currentFile = null;
        $currentAnnotationBatch = collect([]);

        $chunkSize = (int) $this->option('chunk-size', 10000);

        // lazy() is crucial as we can't load all annotations at once!
        // We can't use lazyById because we order by file ID first (to better batch
        // annotations of the same file).
        $generator = $annotations->with('file')->lazy($chunkSize);
        foreach ($generator as $annotation) {
            $progress->advance();

            if ($this->skipPatches) {
                $needsPatch = false;
            } else {
                $needsPatch = $this->force || !$storage->exists(
                    ProcessAnnotatedFile::getTargetPath($annotation)
                );
            }

            if ($this->skipVectors) {
                $needsVector = false;
            } else {
                $needsVector = is_null($annotation->vector_id);
            }

            if ($this->skipSvgs) {
                $needsSvg = false;
            } else {
                $needsSvg = $this->force || !$storage->exists(
                    ProcessAnnotatedFile::getTargetPath($annotation, format: 'svg')
                );
            }

            if (!$needsPatch && !$needsVector && !$needsSvg) {
                continue;
            }

            $count++;

            if (!$currentFile || $currentFile->id !== $annotation->file->id) {
                if ($currentAnnotationBatch->isNotEmpty() && $pushToQueue) {
                    $jobCount++;
                    $this->dispatcheProcessJob($currentFile, $currentAnnotationBatch);
                }

                $currentFile = $annotation->file;
                $currentAnnotationBatch = collect([]);
            }

            $currentAnnotationBatch[] = $annotation->id;
        }

        // Push final job.
        if ($currentAnnotationBatch->isNotEmpty() && $pushToQueue) {
            $jobCount++;
            $this->dispatcheProcessJob($currentFile, $currentAnnotationBatch);
        }

        $progress->finish();

        if ($total === 0) {
            $this->info("\n");
            return;
        }

        $percent = round($count / $total * 100, 2);
        $this->info("\nFound {$count} annotations with missing data ({$percent} %).");
        if ($pushToQueue) {
            $this->info("Pushed {$jobCount} jobs to queue {$this->queue}.");
        }
    }

    protected function dispatcheProcessJob(VolumeFile $file, Collection $ids)
    {
        if ($file instanceof Image) {
            $ids->chunk(1000)->each(fn ($chunk) =>
                ProcessAnnotatedImage::dispatch($file,
                        only: $chunk->toArray(),
                        skipPatches: $this->skipPatches,
                        skipFeatureVectors: $this->skipVectors,
                        skipSvgs: $this->skipSvgs
                    )
                    ->onQueue($this->queue)
            );
        } else {
            $ids->chunk(1000)->each(fn ($chunk) =>
                ProcessAnnotatedVideo::dispatch($file,
                        only: $chunk->toArray(),
                        skipPatches: $this->skipPatches,
                        skipFeatureVectors: $this->skipVectors,
                        skipSvgs: $this->skipSvgs
                    )
                    ->onQueue($this->queue)
            );
        }
    }
}
