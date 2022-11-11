<?php

namespace Biigle\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to the "home" route for your application.
     *
     * This is used by Laravel authentication to redirect users after login.
     *
     * @var string
     */
    public const HOME = '/';

    /**
     * The controller namespace for the application.
     *
     * When present, controller route declarations will automatically be prefixed with
     * this namespace.
     *
     * @var string|null
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
            'id' => '[0-9]{1,10}',
            'id2' => '[0-9]{1,10}',
            // From: \Ramsey\Uuid\Uuid::getFactory()->getValidator()->getPattern()
            'uuid' => "\A[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\z",
        ]);

        $this->configureRateLimiting();

        $this->routes(function () {
            // Web
            Route::middleware('web')
                ->namespace($this->namespace)
                ->group(base_path('routes/web.php'));

            // API
            Route::middleware(['web', 'api', 'auth:web,api'])
                ->namespace($this->namespace.'\Api')
                ->prefix('api/v1')
                ->group(base_path('routes/api.php'));

            // Federated search
            Route::middleware(['api', 'auth:fs'])
                ->namespace($this->namespace.'\Api')
                ->prefix('api/v1')
                ->group(base_path('routes/federated-search.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     *
     * @return void
     */
    protected function configureRateLimiting()
    {
        RateLimiter::for('api', function (Request $request) {
            if ($request->user()) {
                // 3 requests per second.
                return Limit::perHour(10800)->by($request->user()->id);
            }

            // One request per second.
            return Limit::perHour(3600)->by($request->ip());
        });
    }
}
