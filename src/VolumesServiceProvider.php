<?php

namespace Biigle\Modules\Volumes;

use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;
use Biigle\Modules\Volumes\Http\Controllers\Mixins\Views\SearchControllerMixin;
use Biigle\Modules\Volumes\Http\Controllers\Mixins\Views\DashboardControllerMixin;
use Biigle\Modules\Volumes\Http\Controllers\Mixins\Views\Admin\UsersControllerMixin;

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

        $modules->register('volumes', [
            'viewMixins' => [
                'adminMenu',
                'adminIndex',
                'manualTutorial',
                'dashboardStyles',
                'dashboardScripts',
                'dashboardMain.projects',
                'adminShowUser',
                'searchTab',
                'searchTabContent',
            ],
            'controllerMixins' => [
                'adminShowUser' => UsersControllerMixin::class.'@show',
                'search' => SearchControllerMixin::class.'@index',
                'dashboardActivityItems' => DashboardControllerMixin::class.'@activityItems',
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
        $this->mergeConfigFrom(__DIR__.'/config/volumes.php', 'volumes');

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
