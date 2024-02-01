<?php

namespace Biigle\Console\Commands;

use Biigle\Image;
use Biigle\Jobs\MigrateTiledImage;
use Illuminate\Console\Command;
use Queue;

class MigrateTiledImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate-tiled-images
        {in : Storage disk that holds the tiled image ZIP archives}
        {--dry-run : Don\'t submit queued jobs to migrate the images}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Submit queued jobs to unpack zipped tiled images from one storage disk to another';

    /**
     * Handle the command.
     *
     * @return void
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $disk = $this->argument('in');

        $query = Image::where('tiled', true);
        $bar = $this->output->createProgressBar($query->count());

        $query->eachById(function ($image) use ($dryRun, $bar, $disk) {
            if (!$dryRun) {
                $targetPath = fragment_uuid_path($image->uuid);
                Queue::push(new MigrateTiledImage($image, $disk, $targetPath));
            }
            $bar->advance();
        });

        $bar->finish();
        $this->line('');
    }
}
