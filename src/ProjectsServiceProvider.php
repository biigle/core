<?php

namespace Biigle\Modules\Projects;

use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;
use Biigle\Modules\Projects\Http\Controllers\Mixins\Views\SearchControllerMixin;
use Biigle\Modules\Projects\Http\Controllers\Mixins\Views\Admin\UsersControllerMixin;

class ProjectsServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'projects');
        $this->loadTranslationsFrom(__DIR__.'/resources/lang', 'projects');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/projects'),
        ], 'public');

        $router->group([
            'namespace' => 'Biigle\Modules\Projects\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->register('projects', [
            'viewMixins' => [
                'dashboardMain',
                'dashboardButtons',
                'dashboardStyles',
                'dashboardScripts',
                'adminIndex',
                'navbarMenuItem',
                'manualTutorial',
                'adminShowUser',
                'searchTab',
                'searchTabContent',
            ],
            'controllerMixins' => [
                'adminShowUser' => UsersControllerMixin::class.'@show',
                'search' => SearchControllerMixin::class.'@index',
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
        $this->app->singleton('command.projects.publish', function ($app) {
            return new Console\Commands\Publish();
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
        return ['command.projects.publish'];
    }
}
