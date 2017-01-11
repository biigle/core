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
        if (env('HTTP_PROXY')) {
            stream_context_set_default(['http' => [
                'proxy' => 'tcp://'.env('HTTP_PROXY'),
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
        $this->app->bind(\Biigle\Services\Modules::class);
    }
}
