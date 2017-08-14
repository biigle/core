<?php

namespace Biigle\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Broadcast;

// THIS SERVICE PROVIDER IS CURRENTLY NOT LOADED IN config/app.php AND ONLY HERE
// FOR POSSIBLE FUTURE USE OF WEBSOCKETS.

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Broadcast::routes();

        require base_path('routes/channels.php');
    }
}
