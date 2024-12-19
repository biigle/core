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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'sync');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/sync'),
        ], 'public');

        $router->group([
            'namespace' => 'Biigle\Modules\Sync\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->register('sync', [
            'viewMixins' => [
                'adminMenu',
                'labelTreesShowDropdown',
                'newLabelTreeButtons',
                'labelTreesManual',
            ],
            'apidoc' => [__DIR__.'/Http/Controllers/Api/'],
        ]);
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(__DIR__.'/config/sync.php', 'sync');

        $this->app->singleton('command.sync.publish', function ($app) {
            return new \Biigle\Modules\Sync\Console\Commands\Publish;
        });

        $this->app->singleton('command.sync.prune', function ($app) {
            return new \Biigle\Modules\Sync\Console\Commands\Prune;
        });

        $this->app->singleton('command.sync.uuids', function ($app) {
            return new \Biigle\Modules\Sync\Console\Commands\Uuids;
        });

        $this->commands([
            'command.sync.publish',
            'command.sync.prune',
            'command.sync.uuids',
        ]);
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
            'command.sync.prune',
            'command.sync.uuids',
        ];
    }
}
