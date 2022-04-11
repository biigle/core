<?php

namespace Biigle\Modules\Largo\Console\Commands;

use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Jobs\GenerateImageAnnotationPatch;
use Biigle\Modules\Largo\Jobs\GenerateVideoAnnotationPatch;
use Biigle\VideoAnnotation;
use Carbon\Carbon;
use File;
use Illuminate\Console\Command;
use Storage;

class GenerateMissing extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'largo:generate-missing {--dry-run} {--volume=} {--no-image-annotations} {--no-video-annotations} {--queue=} {--newer-than=}
        {--older-than=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate missing patches for annotations.';

    /**
     * Largo patch storage file format.
     *
     * @var string
     */
    protected $format;

    /**
     * Number of annotations missing patches.
     *
     * @var int
     */
    protected $count;

    /**
     * Create a new command instance.
     */
    public function __construct()
    {
        parent::__construct();
        $this->format = config('largo.patch_format');
        $this->count = 0.0;
    }

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle()
    {
        $pushToQueue = !$this->option('dry-run');
        $storage = Storage::disk(config('largo.patch_storage_disk'));
        $queue = $this->option('queue') ?: config('largo.generate_annotation_patch_queue');

        if (!$this->option('no-image-annotations')) {
            $this->handleImageAnnotations($storage, $pushToQueue, $queue);
        }

        $this->count = 0;

        if (!$this->option('no-video-annotations')) {
            $this->handleVideoAnnotations($storage, $pushToQueue, $queue);
        }
    }

    /**
     * Check image annnotation patches
     *
     * @param \Illuminate\Filesystem\FilesystemAdapter $storage
     * @param bool $pushToQueue
     * @param string $queue
     */
    protected function handleImageAnnotations($storage, $pushToQueue, $queue)
    {
        $annotations = ImageAnnotation::join('images', 'images.id', '=', 'image_annotations.image_id')
            ->when($this->option('volume'), function ($query) {
                $query->where('images.volume_id', $this->option('volume'));
            })
            ->when($this->option('newer-than'), function ($query) {
                $query->where('image_annotations.created_at', '>', new Carbon($this->option('newer-than')));
            })
            ->when($this->option('older-than'), function ($query) {
                $query->where('image_annotations.created_at', '<', new Carbon($this->option('older-than')));
            })
            ->select('image_annotations.id', 'images.uuid as uuid');

        $total = $annotations->count();
        $progress = $this->output->createProgressBar($total);
        $this->info("Checking {$total} image annotations...");

        $handleAnnotation = function ($annotation) use ($progress, $pushToQueue, $storage, $queue) {
            $prefix = fragment_uuid_path($annotation->uuid);
            if (!$storage->exists("{$prefix}/{$annotation->id}.{$this->format}")) {
                $this->count++;
                if ($pushToQueue) {
                    GenerateImageAnnotationPatch::dispatch($annotation)
                        ->onQueue($queue);
                }
            }
            $progress->advance();
        };

        $annotations->eachById($handleAnnotation, 10000, 'image_annotations.id', 'id');

        $progress->finish();

        $percent = round($this->count / $total * 100, 2);
        $this->info("\nFound {$this->count} image annotations with missing patches ({$percent} %).");
        if ($pushToQueue) {
            $this->info("Pushed {$this->count} jobs to queue {$queue}.");
        }
    }

    /**
     * Check video annnotation patches
     *
     * @param \Illuminate\Filesystem\FilesystemAdapter $storage
     * @param bool $pushToQueue
     * @param string $queue
     */
    protected function handleVideoAnnotations($storage, $pushToQueue, $queue)
    {
        $annotations = VideoAnnotation::join('videos', 'videos.id', '=', 'video_annotations.video_id')
            ->when($this->option('volume'), function ($query) {
                $query->where('videos.volume_id', $this->option('volume'));
            })
            ->when($this->option('newer-than'), function ($query) {
                $query->where('video_annotations.created_at', '>', new Carbon($this->option('newer-than')));
            })
            ->select('video_annotations.id', 'videos.uuid as uuid');

        $total = $annotations->count();
        $progress = $this->output->createProgressBar($total);
        $this->info("Checking {$total} video annotations...");

        $handleAnnotation = function ($annotation) use ($progress, $pushToQueue, $storage, $queue) {
            $prefix = fragment_uuid_path($annotation->uuid);
            if (!$storage->exists("{$prefix}/v-{$annotation->id}.{$this->format}")) {
                $this->count++;
                if ($pushToQueue) {
                    GenerateVideoAnnotationPatch::dispatch($annotation)
                        ->onQueue($queue);
                }
            }
            $progress->advance();
        };

        $annotations->eachById($handleAnnotation, 10000, 'video_annotations.id', 'id');

        $progress->finish();

        $percent = round($this->count / $total * 100, 2);
        $this->info("\nFound {$this->count} video annotations with missing patches ({$percent} %).");
        if ($pushToQueue) {
            $this->info("Pushed {$this->count} jobs to queue {$queue}.");
        }
    }
}
