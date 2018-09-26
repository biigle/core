<?php

namespace Biigle\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Notifications\DatabaseNotification;

class PruneNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'prune-notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Removes all read database notifications that are older than six months';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        DatabaseNotification::whereNotNull('read_at')
            ->where('created_at', '<', Carbon::now()->subMonths(6))
            ->delete();
    }
}
