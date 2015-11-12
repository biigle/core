<?php

namespace Dias\Modules\Transects;

use Illuminate\Support\ServiceProvider;
use Dias\Services\Modules;

class TransectsServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap the application events.
     *
     * @return void
     */
    public function boot(Modules $modules)
    {
        $this->loadViewsFrom(__DIR__.'/resources/views', 'transects');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/transects'),
        ], 'public');

        include __DIR__.'/Http/routes.php';

        $modules->addMixin('transects', 'dashboard.projects');
        $modules->addMixin('transects', 'dashboardStyles');
        $modules->addMixin('transects', 'projects');
        $modules->addMixin('transects', 'adminMenu');
        $modules->addMixin('transects', 'adminIndex');
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('command.transects.publish', function ($app) {
            return new \Dias\Modules\Transects\Console\Commands\Publish();
        });
        $this->commands('command.transects.publish');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.transects.publish',
        ];
    }
}
