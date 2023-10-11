<?php

namespace Biigle\Console;

use Biigle\FederatedSearchInstance;
use Biigle\Jobs\GenerateFederatedSearchIndex;
use Biigle\Jobs\UpdateFederatedSearchIndex;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('cache:prune-stale-tags')
            ->hourly()
            ->onOneServer();

        $schedule->command('queue:prune-batches')
            ->daily()
            ->onOneServer();

        $schedule->command('prune-notifications')
            ->daily()
            ->onOneServer();

        $schedule
            ->call(function () {
                if (FederatedSearchInstance::withLocalToken()->exists()) {
                    GenerateFederatedSearchIndex::dispatch();
                }
            })
            ->name('generate-federated-search-index')
            // The requests to retrieve the federated search index are sent hourly at 05.
            // This should not collide with this job to generate the index.
            ->hourlyAt(55)
            ->onOneServer();

        $schedule
            ->call(function () {
                FederatedSearchInstance::withRemoteToken()
                    ->eachById([UpdateFederatedSearchIndex::class, 'dispatch']);
            })
            ->name('update-federated-search-index')
            // The jobs to generate the federated search index are run hourly at 55.
            // This should not collide with this job to request the index from another
            // instance.
            ->hourlyAt(05)
            ->onOneServer();

        // Insert scheduled tasks here.
    }

    /**
     * Register the Closure based commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
