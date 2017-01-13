<?php

namespace Biigle\Modules\Volumes;

use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

class VolumesServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'volumes');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/volumes'),
        ], 'public');

        $router->group([
            'namespace' => 'Biigle\Modules\Volumes\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->addMixin('volumes', 'adminMenu');
        $modules->addMixin('volumes', 'adminIndex');
        $modules->addMixin('volumes', 'manualTutorial');
        $modules->addMixin('volumes', 'dashboardStyles');
        $modules->addMixin('volumes', 'dashboardScripts');
        $modules->addMixin('volumes', 'dashboardHotBoxRight');
        $modules->addMixin('volumes', 'dashboardMain.projects');
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('command.volumes.publish', function ($app) {
            return new \Biigle\Modules\Volumes\Console\Commands\Publish();
        });
        $this->commands('command.volumes.publish');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.volumes.publish',
        ];
    }
}
