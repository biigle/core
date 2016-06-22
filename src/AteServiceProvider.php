<?php

namespace Dias\Modules\Ate;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;
use Dias\Modules\Ate\Listeners\ImagesCleanupListener;

class AteServiceProvider extends ServiceProvider {

    /**
     * Bootstrap the application events.
     *
     * @param  \Dias\Services\Modules  $modules
     * @param  \Illuminate\Routing\Router  $router
     *
     * @return void
     */
    public function boot(Router $router)
    {
        $this->loadViewsFrom(__DIR__.'/resources/views', 'ate');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/ate'),
        ], 'public');

        $router->group([
            'namespace' => 'Dias\Modules\Ate\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        \Dias\Annotation::observe(new \Dias\Modules\Ate\Observers\AnnotationObserver);

        \Event::listen('images.cleanup', ImagesCleanupListener::class);
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
            return new \Dias\Modules\Ate\Console\Commands\Publish();
        });
        $this->commands('command.ate.publish');
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
        ];
    }
}
