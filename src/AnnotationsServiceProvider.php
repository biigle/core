<?php

namespace Biigle\Modules\Annotations;

use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;
use Biigle\Modules\Annotations\Http\Controllers\Mixins\Views\SearchControllerMixin;

class AnnotationsServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'annotations');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/annotations'),
        ], 'public');

        $router->group([
            'namespace' => 'Biigle\Modules\Annotations\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->register('annotations', [
            'viewMixins' => [
                'dashboardHotBoxLeft',
                'volumesScripts',
                'adminIndex',
                'manualTutorial',
                'adminShowUser',
                'searchTab',
                'searchTabContent',
                'volumesManualRemoteVolumes',
                'volumesManualImageLabels',
            ],
            'controllerMixins' => [
                'search' => SearchControllerMixin::class.'@index',
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
        $this->app->singleton('command.annotations.publish', function ($app) {
            return new \Biigle\Modules\Annotations\Console\Commands\Publish();
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
