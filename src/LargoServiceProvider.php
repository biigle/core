<?php

namespace Biigle\Modules\Largo;

use Event;
use Biigle\Annotation;
use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Biigle\Events\ImagesDeleted;
use Illuminate\Support\ServiceProvider;
use Biigle\Modules\Largo\Observers\AnnotationObserver;
use Biigle\Modules\Largo\Listeners\ImagesCleanupListener;

class LargoServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'largo');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/largo'),
        ], 'public');

        $this->publishes([
            __DIR__.'/config/largo.php' => config_path('largo.php'),
        ], 'config');

        $router->group([
            'namespace' => 'Biigle\Modules\Largo\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        Annotation::observe(new AnnotationObserver);
        Event::listen(ImagesDeleted::class, ImagesCleanupListener::class);

        $modules->register('largo', [
            'viewMixins' => [
                'volumesSidebar',
                'annotationsScripts',
                'annotationsStyles',
                'annotationsSettingsTab',
                'annotationsLabelsTab',
                'projectsShowToolbar',
                'annotationsManualSidebarSettings',
                'annotationsManualSidebarLabelTrees',
                'labelTreesShowToolbar',
                'manualTutorial',
                'labelTreesManual',
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
        $this->mergeConfigFrom(__DIR__.'/config/largo.php', 'largo');

        $this->app->singleton('command.largo.publish', function ($app) {
            return new \Biigle\Modules\Largo\Console\Commands\Publish;
        });
        $this->commands('command.largo.publish');

        $this->app->singleton('command.largo.config', function ($app) {
            return new \Biigle\Modules\Largo\Console\Commands\Config;
        });
        $this->commands('command.largo.config');

        $this->app->singleton('command.largo.generate-missing', function ($app) {
            return new \Biigle\Modules\Largo\Console\Commands\GenerateMissing;
        });
        $this->commands('command.largo.generate-missing');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.largo.publish',
            'command.largo.config',
            'command.largo.generate-missing',
        ];
    }
}
