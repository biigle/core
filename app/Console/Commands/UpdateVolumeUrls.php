<?php

namespace Biigle\Console\Commands;

use Biigle\Volume;
use DB;
use Illuminate\Console\Command;

class UpdateVolumeUrls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'update-volume-urls
        {--dry-run : Don\'t save updated volume URLs to the DB}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update volume URLs from "[prefix]/[directories]" to the "[disk]://[directories]" pattern.';

    /**
     * Is this a dry run?
     *
     * @var bool
     */
    protected $dryRun;

    /**
     * Available storage disks.
     *
     * @var array
     */
    protected $disks;

    /**
     * Handle the command.
     *
     * @return void
     */
    public function handle()
    {
        $this->dryRun = $this->option('dry-run');
        $this->disks = array_keys(config('filesystems.disks'));

        do {
            $toUpdate = Volume::where('url', 'not like', '%://%')->pluck('url', 'id');
            $toUpdateCount = $toUpdate->count();

            if ($toUpdateCount > 0) {
                $this->line("Found {$toUpdate->count()} volumes that need to be updated.");
                $this->updateVolumes($toUpdate);
            } else {
                $this->info('All volumes have been updated.');
            }
        } while ($toUpdateCount > 0);
    }

    protected function updateVolumes($volumes)
    {
        $url = $volumes->first();
        $prefix = $this->ask('Please enter the volume URL prefix that you want to replace with a storage disk.', dirname($url));

        $matches = $volumes->filter(function ($url) use ($prefix) {
            return strpos($url, $prefix) === 0;
        });
        $matchesCount = $matches->count();

        if ($matchesCount > 0) {
            $this->line("{$matchesCount} volumes match this prefix.");
            $disk = $this->choice('Please choose the storage disk to use for these volumes.', $this->disks, 0);

            $matches->each(function ($url, $id) use ($prefix, $disk) {
                $url = preg_replace("#^{$prefix}/?#", "{$disk}://", $url, 1);
                if (!$this->dryRun) {
                    // Use DB here to skip automatically updating the timestamps.
                    DB::table('volumes')->where('id', $id)->update(['url' => $url]);
                }
            });
        } else {
            $this->comment('No volumes match this prefix.');
        }
    }
}
