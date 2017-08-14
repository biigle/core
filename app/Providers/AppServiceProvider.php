<?php

namespace Biigle\Providers;

use Auth;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        View::composer('*', function ($view) {
            // Make authenticated user available in any view.
            $view->with('user', Auth::user());
        });

        // Configure global proxy settings for readfile() and the likes.
        if (config('app.proxy')) {
            stream_context_set_default(['http' => [
                'proxy' => 'tcp://'.config('app.proxy'),
                'request_fulluri' => true,
            ]]);
        }
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->bind('modules', function () {
            return new \Biigle\Services\Modules;
        });

        $this->app->bind('vips-image', function () {
            return new \Jcupitt\Vips\Image(null);
        });
    }
}
