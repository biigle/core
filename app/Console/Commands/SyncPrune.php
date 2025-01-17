<?php

namespace Biigle\Console\Commands;

use Biigle\Services\Import\ArchiveManager;
use Illuminate\Console\Command;

class SyncPrune extends Command
{
    /**
     * The console command name.
     *
     * @var string
     */
    protected $name = 'sync:prune';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete uploaded import files that are older than one week and where the import was not finished.';

    /**
     * Execute the command.
     *
     * @return void
     */
    public function handle(ArchiveManager $manager)
    {
        $manager->prune();
    }
}
