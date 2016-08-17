<?php

namespace Dias\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array
     */
    protected $listen = [
        'images.cleanup' => [
            \Dias\Listeners\CleanupThumbnails::class,
        ],
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        parent::boot();

        \Dias\Project::observe(new \Dias\Observers\ProjectObserver);
        \Dias\User::observe(new \Dias\Observers\UserObserver);
        \Dias\Transect::observe(new \Dias\Observers\TransectObserver);
        \Dias\Image::observe(new \Dias\Observers\ImageObserver);
    }
}
