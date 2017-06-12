<?php

namespace Biigle\Modules\Export;

use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Factory as EloquentFactory;

class ExportServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'export');
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');

        $router->group([
            'namespace' => 'Biigle\Modules\Export\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/export'),
        ], 'public');

        $this->publishes([
            __DIR__.'/config/export.php' => config_path('export.php'),
        ], 'config');

        $modules->addMixin('export', 'projectsShowToolbar');
        $modules->addMixin('export', 'annotationsSettingsTab');
        $modules->addMixin('export', 'annotationsScripts');
        $modules->addMixin('export', 'manualTutorial');
        $modules->addMixin('export', 'volumesSidebar');
        $modules->addMixin('export', 'annotationsManualSidebarSettings');

        if (config('export.notifications.allow_user_settings')) {
            $modules->addMixin('export', 'settings.notifications');
        }
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(__DIR__.'/config/export.php', 'export');

        $this->app->singleton('command.export.publish', function ($app) {
            return new \Biigle\Modules\Export\Console\Commands\Publish();
        });

        $this->commands([
            'command.export.publish',
        ]);

        $this->registerEloquentFactoriesFrom(__DIR__.'/database/factories');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.export.publish',
        ];
    }

    /**
     * Register factories.
     *
     * @param  string  $path
     * @return void
     */
    protected function registerEloquentFactoriesFrom($path)
    {
        $this->app->make(EloquentFactory::class)->load($path);
    }
}
