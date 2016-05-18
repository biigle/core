<?php

namespace Dias\Modules\Export;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;
use Dias\Modules\Export\Console\Commands\Install as InstallCommand;

class ExportServiceProvider extends ServiceProvider {

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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'export');
        $router->group([
            'namespace' => 'Dias\Modules\Export\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });
        $this->publishes([
            __DIR__.'/database/migrations/' => database_path('migrations')
        ], 'migrations');
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        // set up the install console command
        $this->app->singleton('command.export.install', function ($app) {
            return new InstallCommand();
        });

        $this->commands('command.export.install');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.export.install',
        ];
    }
}
