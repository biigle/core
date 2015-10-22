<?php

namespace Dias\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Dynamically loads and provides thumbnail service chosen in the
 * application config.
 */
class ThumbnailServiceProvider extends ServiceProvider
{
    /**
     * Indicates if loading of the provider is deferred.
     *
     * @var bool
     */
    protected $defer = true;

    /**
     * Register the chosen thumbnails service.
     */
    public function register()
    {
        $this->app->singleton('Dias\Contracts\ThumbnailService', function ($app) {
            // which service to use is set in the thumbnails config
            $chosenAdapter = config('thumbnails.service');

            return new $chosenAdapter();
        });
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return ['Dias\Contracts\ThumbnailService'];
    }
}
