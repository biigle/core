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
        \Biigle\Events\ImagesDeleted::class => [
            \Biigle\Listeners\CleanupThumbnails::class,
        ],
        \Biigle\Events\TiledImagesDeleted::class => [
            \Biigle\Listeners\CleanupImageTiles::class,
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
        \Biigle\Volume::observe(new \Biigle\Observers\VolumeObserver);
        \Biigle\Image::observe(new \Biigle\Observers\ImageObserver);
    }
}
