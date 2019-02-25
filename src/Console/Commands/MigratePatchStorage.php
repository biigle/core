<?php

namespace Biigle\Modules\Largo\Console\Commands;

use File;
use Storage;
use Biigle\Annotation;
use FilesystemIterator;
use InvalidArgumentException;
use Illuminate\Console\Command;
use Biigle\Modules\Largo\Jobs\GenerateAnnotationPatch;

class MigratePatchStorage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'largo:migrate-patch-storage
        {--dry-run : Do not move or delete any files}
        {path : Old storage directory for Largo patches, relative to the BIIGLE storage directory}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate Largo patches to the new disk storage.';

    /**
     * Largo patch storage disk.
     *
     * @var string
     */
    protected $disk;

    /**
     * Specifies if this is a dry run.
     *
     * @var bool
     */
    protected $dryRun;

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle()
    {
        $this->disk = Storage::disk(config('largo.patch_storage_disk'));
        $this->dryRun = $this->option('dry-run');
        $oldPath = storage_path($this->argument('path'));

        try {
            $directories = File::directories($oldPath);
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage());
            return;
        }

        foreach ($directories as $directory) {
            $files = [];
            $iterator = new FilesystemIterator($directory);
            foreach ($iterator as $file) {
                $files[] = $file;
            }

            $volumeId = basename($directory);
            $this->info("Migrating volume {$volumeId}.");
            $progress = $this->output->createProgressBar(count($files));

            collect($files)->chunk(1000)->each(function ($chunk) use ($progress) {
                // Use IDs as keys.
                $chunk = $chunk->map(function ($file) {
                        return intval(explode('.', $file->getBasename())[0]);
                    })
                    ->combine($chunk);

                $annotations = Annotation::with('image')
                    ->findMany($chunk->keys())
                    ->keyBy('id');

                foreach ($chunk as $id => $file) {
                    $prefix = fragment_uuid_path($annotations[$id]->image->uuid);
                    if (!$this->dryRun) {
                        $this->disk->putFileAs($prefix, $file, $file->getBasename());
                    }
                }

                $progress->advance($chunk->count());
            });
            $progress->finish();
            $this->line('');
        }

        $this->info("Finished. You can delete '{$oldPath}' now.");
    }
}
