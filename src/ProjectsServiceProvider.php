<?php

namespace Dias\Modules\Projects;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;
use Dias\Services\Modules;

class ProjectsServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'projects');
        $this->loadTranslationsFrom(__DIR__.'/resources/lang', 'projects');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/projects'),
        ], 'public');

        $router->group([
            'namespace' => 'Dias\Modules\Projects\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->addMixin('projects', 'dashboard');
        $modules->addMixin('projects', 'adminIndex');
        $modules->addMixin('projects', 'navbarMenuItem');
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('command.projects.publish', function ($app) {
            return new \Dias\Modules\Projects\Console\Commands\Publish();
        });
        $this->commands('command.projects.publish');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.projects.publish',
        ];
    }
}
