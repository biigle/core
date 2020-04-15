<?php

namespace Biigle\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * This namespace is applied to your controller routes.
     *
     * In addition, it is set as the URL generator's root namespace.
     *
     * @var string
     */
    protected $namespace = 'Biigle\Http\Controllers';

    /**
     * Define your route model bindings, pattern filters, etc.
     *
     * @return void
     */
    public function boot()
    {
        // IDs are integers which can have the maximum value of 2147483647 (10 digits).
        // Regex validation of a 32bit integer is very messy so we only do a rough check
        // for the length of the number. Queries for IDs above 2147483647 with 10 digits
        // will still result in database exceptions but anything else is not worth the
        // effort.
        // Sometimes there are multiple IDs in the same route but they cannot have the
        // same name, hence id and id2.
        Route::patterns([
            //
            'id' => '[0-9]{1,10}',
            'id2' => '[0-9]{1,10}',
        ]);

        parent::boot();
    }

    /**
     * Define the routes for the application.
     *
     * @return void
     */
    public function map()
    {
        $this->mapWebRoutes();
        $this->mapApiRoutes();

        //
    }

    /**
     * Define the "web" routes for the application.
     *
     * These routes all receive session state, CSRF protection, etc.
     *
     * @return void
     */
    protected function mapWebRoutes()
    {
        Route::middleware('web')
            ->namespace($this->namespace)
            ->group(base_path('routes/web.php'));
    }

    /**
     * Define the "api" routes for the application.
     *
     * These routes are typically stateless.
     *
     * @return void
     */
    protected function mapApiRoutes()
    {
        Route::middleware(['web', 'auth:web,api'])
            ->namespace($this->namespace.'\Api')
            ->prefix('api/v1')
            ->group(base_path('routes/api.php'));
    }
}
