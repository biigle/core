<?php

namespace Biigle\Modules\Sync;

use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

class SyncServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap the application events.
     *
     * @param  \Biigle\Services\Modules  $modules
     * @param  \Illuminate\Routing\Router  $router
     *
     * @return void
     */
    public function boot(Modules $modules, Router $router)
    {
        // $this->loadViewsFrom(__DIR__.'/resources/views', 'sync');
        // $this->loadMigrationsFrom(__DIR__.'/database/migrations');

        // $this->publishes([
        //     __DIR__.'/public/assets' => public_path('vendor/sync'),
        // ], 'public');

        // $router->group([
        //     'namespace' => 'Biigle\Modules\Sync\Http\Controllers',
        //     'middleware' => 'web',
        // ], function ($router) {
        //     require __DIR__.'/Http/routes.php';
        // });

        $modules->register('sync', [
            'viewMixins' => [
                //
            ],
        ]);
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('command.sync.publish', function ($app) {
            return new \Biigle\Modules\Sync\Console\Commands\Publish();
        });

        $this->commands('command.sync.publish');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.sync.publish',
        ];
    }
}
