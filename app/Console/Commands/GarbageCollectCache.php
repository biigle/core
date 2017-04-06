<?php

namespace Biigle\Console\Commands;

use File;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Contracts\Filesystem\FileNotFoundException;

class GarbageCollectCache extends Command
{
    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'cache:gc';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all expired items from the filesystem cache';

    /**
     * Handle the command.
     *
     * @return void
     */
    public function handle()
    {
        $files = File::allFiles(config('cache.stores.file.path'));
        $now = Carbon::now()->getTimestamp();

        foreach ($files as $file) {
            try {
                $expire = substr(File::get($file), 0, 10);
                if ($now >= $expire) {
                    File::delete($file);
                }
            } catch (FileNotFoundException $e) {
                continue;
            }
        }
    }
}
