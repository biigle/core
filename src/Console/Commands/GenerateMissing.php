<?php

namespace Biigle\Modules\Largo\Console\Commands;

use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedFile;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedImage;
use Biigle\Modules\Largo\Jobs\ProcessAnnotatedVideo;
use Biigle\VideoAnnotation;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Storage;

class GenerateMissing extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'largo:generate-missing
        {--dry-run}
        {--volume=}
        {--no-image-annotations}
        {--no-video-annotations}
        {--queue=}
        {--newer-than=}
        {--older-than=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate missing patches for annotations.';

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle()
    {
        if (!$this->option('no-image-annotations')) {
            $this->handleImageAnnotations();
        }

        if (!$this->option('no-video-annotations')) {
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
            // Order by annotation ID second to ensure a deterministic order for lazy().
            ->orderBy('image_annotations.id')
            ->when($this->option('volume'), function ($query) {
                $query->where('images.volume_id', $this->option('volume'));
            })
            ->when($this->option('newer-than'), function ($query) {
                $query->where('image_annotations.created_at', '>', new Carbon($this->option('newer-than')));
            })
            ->when($this->option('older-than'), function ($query) {
                $query->where('image_annotations.created_at', '<', new Carbon($this->option('older-than')));
            })
            ->select('image_annotations.id', 'image_annotations.image_id');

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
            // Order by annotation ID second to ensure a deterministic order for lazy().
            ->orderBy('video_annotations.id')
            ->when($this->option('volume'), function ($query) {
                $query->where('videos.volume_id', $this->option('volume'));
            })
            ->when($this->option('newer-than'), function ($query) {
                $query->where('video_annotations.created_at', '>', new Carbon($this->option('newer-than')));
            })
            ->when($this->option('older-than'), function ($query) {
                $query->where('video_annotations.created_at', '<', new Carbon($this->option('older-than')));
            })
            ->select('video_annotations.id', 'video_annotations.video_id');

        $this->line("Video annotations");
        $this->handleAnnotations($annotations);
    }

    protected function handleAnnotations(Builder $annotations): void
    {
        $pushToQueue = !$this->option('dry-run');
        $storage = Storage::disk(config('largo.patch_storage_disk'));
        $queue = $this->option('queue') ?: config('largo.generate_annotation_patch_queue');

        $count = 0;
        $jobCount = 0;
        $total = $annotations->count();
        $progress = $this->output->createProgressBar($total);
        $this->info("Checking {$total} annotations...");

        $currentFile = null;
        $currentAnnotationBatch = [];

        // lazy() is crucial as we can't load all annotations at once!
        foreach ($annotations->with('file')->lazy() as $annotation) {
            $progress->advance();
            if ($storage->exists(ProcessAnnotatedFile::getTargetPath($annotation))) {
                continue;
            }

            $count++;

            if (!$currentFile || $currentFile->id !== $annotation->file->id) {
                if (!empty($currentAnnotationBatch) && $pushToQueue) {
                    $jobCount++;
                    if ($currentFile instanceof Image) {
                        ProcessAnnotatedImage::dispatch($currentFile,
                                only: $currentAnnotationBatch
                            )
                            ->onQueue($queue);
                    } else {
                        ProcessAnnotatedVideo::dispatch($currentFile,
                                only: $currentAnnotationBatch
                            )
                            ->onQueue($queue);
                    }
                }

                $currentFile = $annotation->file;
                $currentAnnotationBatch = [];
            }

            $currentAnnotationBatch[] = $annotation->id;
        }

        // Push final job.
        if (!empty($currentAnnotationBatch) && $pushToQueue) {
            $jobCount++;
            if ($currentFile instanceof Image) {
                ProcessAnnotatedImage::dispatch($currentFile,
                        only: $currentAnnotationBatch
                    )
                    ->onQueue($queue);
            } else {
                ProcessAnnotatedVideo::dispatch($currentFile,
                        only: $currentAnnotationBatch
                    )
                    ->onQueue($queue);
            }
        }

        $progress->finish();

        if($total === 0) {
            $this->info("\n");
            return;
        }

        $percent = round($count / $total * 100, 2);
        $this->info("\nFound {$count} annotations with missing patches ({$percent} %).");
        if ($pushToQueue) {
            $this->info("Pushed {$jobCount} jobs to queue {$queue}.");
        }
    }
}
