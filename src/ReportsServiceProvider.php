<?php

namespace Biigle\Modules\Reports;

use Biigle\Modules\Reports\Http\Controllers\Mixins\Views\SearchControllerMixin;
use Biigle\Services\Modules;
use Illuminate\Database\Eloquent\Factory as EloquentFactory;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Routing\Router;

class ReportsServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'reports');
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');

        $router->group([
            'namespace' => 'Biigle\Modules\Reports\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/reports'),
        ], 'public');

        $this->publishes([
            __DIR__.'/config/reports.php' => config_path('reports.php'),
        ], 'config');

        $modules->register('reports', [
            'viewMixins' => [
                'projectsShowToolbar',
                'annotationsSettingsTab',
                'annotationsScripts',
                'manualTutorial',
                'volumesSidebar',
                'annotationsManualSidebarSettings',
                'searchTab',
                'searchTabContent',
                'videosSidebar',
                'manualVideosSidebar',
            ],
            'controllerMixins' => [
                'search' => SearchControllerMixin::class.'@index',
            ],
            'apidoc' => [__DIR__.'/Http/Controllers/Api/'],
        ]);

        if (config('reports.notifications.allow_user_settings')) {
            $modules->registerViewMixin('reports', 'settings.notifications');
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
        $this->mergeConfigFrom(__DIR__.'/config/reports.php', 'reports');

        $this->app->singleton('command.reports.publish', function ($app) {
            return new \Biigle\Modules\Reports\Console\Commands\Publish();
        });

        $this->commands([
            'command.reports.publish',
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
            'command.reports.publish',
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
