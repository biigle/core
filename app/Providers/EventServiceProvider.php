<?php

namespace Biigle\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

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
        \Biigle\Events\VideoDeleted::class => [
            \Biigle\Listeners\PrepareDeleteVideoThumbnails::class,
            \Biigle\Listeners\DeleteVideoVolumeThumbnails::class,
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
