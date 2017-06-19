<?php

namespace Biigle\Modules\Export;

use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Database\Eloquent\Factory as EloquentFactory;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class ExportServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        Report::class => Policies\ReportPolicy::class,
    ];

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
        $modules->addMixin('export', 'notificationTabs');

        if (config('export.notifications.allow_user_settings')) {
            $modules->addMixin('export', 'settings.notifications');
        }

        $this->registerPolicies();
        Report::observe(new Observers\ReportObserver);
        \Biigle\User::observe(new Observers\UserObserver);
        \Biigle\Project::observe(new Observers\ProjectObserver);
        \Biigle\Volume::observe(new Observers\VolumeObserver);
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

        if (config('app.env') === 'testing') {
            $this->registerEloquentFactoriesFrom(__DIR__.'/database/factories');
        }
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
