<?php

namespace Biigle\Providers;

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
            \Biigle\Listeners\CleanupThumbnails::class,
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

        \Biigle\Project::observe(new \Biigle\Observers\ProjectObserver);
        \Biigle\User::observe(new \Biigle\Observers\UserObserver);
        \Biigle\Transect::observe(new \Biigle\Observers\TransectObserver);
        \Biigle\Image::observe(new \Biigle\Observers\ImageObserver);
    }
}
