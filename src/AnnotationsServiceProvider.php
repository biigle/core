<?php

namespace Dias\Modules\Annotations;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;
use Dias\Services\Modules;

class AnnotationsServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap the application events.
     *
     * @param  \Dias\Services\Modules  $modules
     * @param  \Illuminate\Routing\Router  $router
     *
     * @return void
     */
    public function boot(Modules $modules, Router $router)
    {
        $this->loadViewsFrom(__DIR__.'/resources/views', 'annotations');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/annotations'),
        ], 'public');

        $router->group([
            'namespace' => 'Dias\Modules\Annotations\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->addMixin('annotations', 'transects');
        $modules->addMixin('annotations', 'transectsStyles');
        $modules->addMixin('annotations', 'transectsScripts');
        $modules->addMixin('annotations', 'transectsMenubar');
        $modules->addMixin('annotations', 'transectsFilters');
        $modules->addMixin('annotations', 'adminIndex');
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('command.annotations.publish', function ($app) {
            return new \Dias\Modules\Annotations\Console\Commands\Publish();
        });
        $this->commands('command.annotations.publish');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.annotations.publish',
        ];
    }
}
