<?php

namespace Biigle\Providers;

use Biigle\Support\PatchedQueueWorker;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Queue\QueueServiceProvider as Base;

class QueueServiceProvider extends Base
{
    /**
     * Register the queue worker.
     *
     * Override the default queue worker to use our custom patched one because our
     * change was not accepted in upstream.
     * See: https://github.com/laravel/framework/pull/56019
     *
     * @return void
     */
    protected function registerWorker()
    {
        // Use closures from original implementation to reduce risk of breakage during
        // Laravel upgrades. Use lightweight method to get protected properties.
        // See: https://stackoverflow.com/a/27754169/1796523
        parent::registerWorker();
        $worker = (array) $this->app['queue.worker'];
        $isDownForMaintenance = $worker[chr(0).'*'.chr(0).'isDownForMaintenance'];
        $resetScope = $worker[chr(0).'*'.chr(0).'resetScope'];

        $this->app->singleton(
            'queue.worker',
            fn ($app) =>
            new PatchedQueueWorker(
                $app['queue'],
                $app['events'],
                $app[ExceptionHandler::class],
                $isDownForMaintenance,
                $resetScope
            )
        );
    }
}
