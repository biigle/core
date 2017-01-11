<?php

namespace Biigle\Modules\Ate;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;
use Biigle\Modules\Ate\Listeners\ImagesCleanupListener;
use Biigle\Services\Modules;

class AteServiceProvider extends ServiceProvider {

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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'ate');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/ate'),
        ], 'public');

        $this->publishes([
            __DIR__.'/config/ate.php' => config_path('ate.php'),
        ], 'config');

        $router->group([
            'namespace' => 'Biigle\Modules\Ate\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        \Biigle\Annotation::observe(new \Biigle\Modules\Ate\Observers\AnnotationObserver);

        \Event::listen('images.cleanup', ImagesCleanupListener::class);

        $modules->addMixin('ate', 'transectsMenubar');
        $modules->addMixin('ate', 'annotationsScripts');
        $modules->addMixin('ate', 'annotationsStyles');
        $modules->addMixin('ate', 'annotationsSidebar');
        $modules->addMixin('ate', 'annotationsSettings');
        $modules->addMixin('ate', 'projectsShowToolbar');
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(__DIR__.'/config/ate.php', 'ate');

        $this->app->singleton('command.ate.publish', function ($app) {
            return new \Biigle\Modules\Ate\Console\Commands\Publish();
        });
        $this->commands('command.ate.publish');

        $this->app->singleton('command.ate.config', function ($app) {
            return new \Biigle\Modules\Ate\Console\Commands\Config();
        });
        $this->commands('command.ate.config');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.ate.publish',
            'command.ate.config',
        ];
    }
}
