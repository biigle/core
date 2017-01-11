<?php

namespace Biigle\Modules\Transects;

use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

class TransectsServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'transects');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/transects'),
        ], 'public');

        $router->group([
            'namespace' => 'Biigle\Modules\Transects\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->addMixin('transects', 'adminMenu');
        $modules->addMixin('transects', 'adminIndex');
        $modules->addMixin('transects', 'manualTutorial');
        $modules->addMixin('transects', 'dashboardStyles');
        $modules->addMixin('transects', 'dashboardScripts');
        $modules->addMixin('transects', 'dashboardHotBoxRight');
        $modules->addMixin('transects', 'dashboardMain.projects');
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('command.transects.publish', function ($app) {
            return new \Biigle\Modules\Transects\Console\Commands\Publish();
        });
        $this->commands('command.transects.publish');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.transects.publish',
        ];
    }
}
