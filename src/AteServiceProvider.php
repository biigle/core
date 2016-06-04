<?php

namespace Dias\Modules\Ate;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;
// use Dias\Modules\Ate\Console\Commands\Install as InstallCommand;

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
        $router->group([
            'namespace' => 'Dias\Modules\Ate\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        
    }
}
