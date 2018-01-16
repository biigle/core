<?php

namespace Biigle\Console\Commands;

use File;
use Illuminate\Console\Command;

class UpdateThumbnailStorageScheme extends Command
{
    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'update-thumbnail-storage-scheme';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Apply the new thumbnail storage scheme that uses subdirectories so a single directory does not contain hundreds of thousands of thumbnails.';

    /**
     * Handle the command.
     *
     * @return void
     */
    public function handle()
    {
        $thumbsDirectory = public_path(config('thumbnails.uri'));
        $format = config('thumbnails.format');
        $thumbs = File::glob("{$thumbsDirectory}/*.{$format}");

        if (empty($thumbs)) {
            $this->line('No thumbnails found. Maybe the new storage scheme has already been applied?');
            return;
        }

        $progress = $this->output->createProgressBar(count($thumbs));

        foreach ($thumbs as $thumb) {
            $basename = File::basename($thumb);
            $target = "{$thumbsDirectory}/{$basename[0]}{$basename[1]}/{$basename[2]}{$basename[3]}";
            File::makeDirectory($target, 0755, true, true);
            File::move($thumb, "{$target}/{$basename}");

            $progress->advance();
        }

        $progress->finish();$this->info('');
        $this->info('Done.');
    }
}
