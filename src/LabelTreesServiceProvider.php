<?php

namespace Biigle\Modules\LabelTrees;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;
use Biigle\Services\Modules;

class LabelTreesServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'label-trees');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/label-trees'),
        ], 'public');

        $router->group([
            'namespace' => 'Biigle\Modules\LabelTrees\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->addMixin('label-trees', 'dashboardButtons');
        $modules->addMixin('label-trees', 'adminMenu');
        $modules->addMixin('label-trees', 'navbarMenuItem');
        $modules->addMixin('label-trees', 'manualTutorial');
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(__DIR__.'/config/label-trees.php', 'label-trees');

        $this->app->singleton('command.label-trees.publish', function ($app) {
            return new \Biigle\Modules\LabelTrees\Console\Commands\Publish();
        });
        $this->commands('command.label-trees.publish');

        $this->app->singleton("Biigle\Services\LabelSourceAdapters\WormsAdapter", function ($app) {
            return new \Biigle\Modules\LabelTrees\Services\LabelSourceAdapters\WormsAdapter();
        });
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.label-trees.publish',
        ];
    }
}
