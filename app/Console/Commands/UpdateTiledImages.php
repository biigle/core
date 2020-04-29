<?php

namespace Biigle\Console\Commands;

use File;
use Phar;
use Storage;
use PharData;
use ZipArchive;
use SplFileInfo;
use Biigle\Image;
use Illuminate\Console\Command;
use Illuminate\Contracts\Filesystem\FileNotFoundException;

class UpdateTiledImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'update-tiled-images
        {--workers=1 : Number of commands that are run in parallel}
        {--worker=0 : Index (starting from 0) of this command among all commands that run in parallel}
        {--dry-run : Don\'t save updated archives and don\'t delete the old archives.}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update tiled image storage from .zip to .tar.gz.';

    /**
     * Is this a dry run?
     *
     * @var bool
     */
    protected $dryRun;

    /**
     * Tiled image storage disk.
     *
     * @var Filesystem
     */
    protected $disk;

    /**
     * Handle the command.
     *
     * @return void
     */
    public function handle()
    {
        $this->dryRun = $this->option('dry-run');
        $this->disk = Storage::disk(config('image.tiles.disk'));

        $workers = intval($this->option('workers'));
        $worker = intval($this->option('worker'));

        $query = Image::where('tiled', true);
        $total = $query->count();

        if ($total > 0) {
            $bar = $this->output->createProgressBar(ceil($total / $workers));
            $current = 0;

            $query->eachById(function ($image) use ($bar, &$current, $workers, $worker) {
                if ($current % $workers === $worker) {
                    $this->updateImage($image);
                    $bar->advance();
                }
                $current += 1;
            });

            $bar->finish();
            $this->line('');
        } else {
            $this->comment('No tiled images to process.');
        }

    }

    public function updateImage($image)
    {
        $uuid = $image->uuid;
        $fragment = fragment_uuid_path($uuid);
        $directory = substr($fragment, 0, 5);
        $tmpDir = sys_get_temp_dir();
        $path = "{$tmpDir}/{$uuid}";

        if (!$this->disk->exists("{$fragment}.tar.gz")) {
            try {
                File::put("{$path}.zip", $this->disk->readStream($fragment));
            } catch (FileNotFoundException $e) {
                return;
            }

            try {
                $oldArchive = new ZipArchive;
                $oldArchive->open("{$path}.zip");
                $oldArchive->extractTo($tmpDir);
                $oldArchive->close();
                $archive = new PharData("{$path}.tar");
                $archive->buildFromDirectory($path);
                $archive->compress(Phar::GZ);

                if (!$this->dryRun) {
                    $file = new SplFileInfo("{$path}.tar.gz");
                    $this->disk->putFileAs($directory, $file, "{$uuid}.tar.gz");
                }
            } finally {
                File::delete("{$path}.zip");
                File::deleteDirectory($path);
                File::delete("{$path}.tar");
                File::delete("{$path}.tar.gz");
            }
        }

        if (!$this->dryRun) {
            $this->disk->delete($fragment);
        }
    }
}
