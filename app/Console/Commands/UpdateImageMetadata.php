<?php

namespace Biigle\Console\Commands;

use Biigle\Image;
use Biigle\Volume;
use Illuminate\Console\Command;

class UpdateImageMetadata extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'update-image-metadata
        {--dry-run : Don\'t strip obsolete metadata or push jobs to the queue}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reprocess all images to store metadata like height, width, size od mimetype in the DB';

    /**
     * Is this a dry run?
     *
     * @var bool
     */
    protected $dryRun;

    /**
     * Handle the command.
     *
     * @return void
     */
    public function handle()
    {
        $this->dryRun = $this->option('dry-run');
        $this->stripTileProperties();
        $this->dispatchReprocessJobs();
    }

    /**
     * Removes the tileProperties attribute from images.
     */
    protected function stripTileProperties()
    {
        $images = Image::whereRaw("jsonb_exists(attrs::jsonb, 'tileProperties')")
            ->select('id', 'attrs')
            ->get();

        $this->line('Removing obsolete image tileProperties.');

        $total = $images->count();

        if ($total > 0) {
            $remaining = $total;
            $bar = $this->output->createProgressBar($total);

            foreach ($images as $image) {
                $attrs = $image->attrs;
                unset($attrs['tileProperties']);
                $image->attrs = $attrs;
                if (!$this->dryRun) {
                    $image->save();
                }

                $remaining--;

                if ($remaining % 1000 === 0) {
                    $bar->setProgress($total - $remaining);
                }
            }

            $bar->setProgress($total);
            $bar->finish();
            $this->line('');
        }

        $this->info('Done.');
    }

    /**
     * Dispatches jobs to process all images anew.
     */
    protected function dispatchReprocessJobs()
    {
        $volumes = Volume::select('id')->get();
        $this->line('Submitting jobs to reprocess images.');

        foreach ($volumes as $volume) {
            if (!$this->dryRun) {
                $volume->handleNewImages();
            }
        }

        $this->info('Done.');
    }
}
