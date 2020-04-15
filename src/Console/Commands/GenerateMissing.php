<?php

namespace Biigle\Modules\Largo\Console\Commands;

use File;
use Storage;
use Biigle\Annotation;
use Illuminate\Console\Command;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;

class GenerateMissing extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'largo:generate-missing {--dry-run} {--volume=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate missing patches for annotations.';

    /**
     * Largo patch storage disk.
     *
     * @var string
     */
    protected $disk;

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
        $storage = Storage::disk($this->disk);

        $annotations = Annotation::join('images', 'images.id', '=', 'annotations.image_id')
            ->when($this->option('volume'), function ($query) {
                $query->where('images.volume_id', $this->option('volume'));
            })
            ->select('annotations.id', 'images.uuid as uuid');

        $total = $annotations->count();
        $progress = $this->output->createProgressBar($total);
        $this->info("Checking {$total} annotations...");

        $handleChunk = function ($chunk) use ($progress, $pushToQueue, $storage) {
            foreach ($chunk as $annotation) {
                $prefix = fragment_uuid_path($annotation->uuid);
                if (!$storage->exists("{$prefix}/{$annotation->id}.{$this->format}")) {
                    $this->count++;
                    if ($pushToQueue) {
                        GenerateAnnotationPatch::dispatch($annotation)
                            ->onQueue(config('largo.generate_annotation_patch_queue'));
                    }
                }
            }
            $progress->advance($chunk->count());
        };

        $annotations->chunkById(10000, $handleChunk, 'annotations.id', 'id');
        $progress->finish();

        $percent = round($this->count / $total * 100, 2);
        $this->info("\nFound {$this->count} annotations with missing patches ({$percent} %).");
        if ($pushToQueue) {
            $this->info("Pushed {$this->count} jobs to the queue.");
        }
    }
}
