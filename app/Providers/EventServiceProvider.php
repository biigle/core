<?php

namespace Biigle\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        \Biigle\Events\ImagesDeleted::class => [
            \Biigle\Listeners\CleanupImageThumbnails::class,
        ],
        \Biigle\Events\TiledImagesDeleted::class => [
            \Biigle\Listeners\CleanupImageTiles::class,
        ],
        \Biigle\Events\VideosDeleted::class => [
            \Biigle\Listeners\CleanupVideoThumbnails::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        \Biigle\Image::observe(new \Biigle\Observers\ImageObserver);
        \Biigle\Project::observe(new \Biigle\Observers\ProjectObserver);
        \Biigle\Report::observe(new \Biigle\Observers\ReportObserver);
        \Biigle\User::observe(new \Biigle\Observers\UserObserver);
        \Biigle\Video::observe(new \Biigle\Observers\VideoObserver);
        \Biigle\Volume::observe(new \Biigle\Observers\VolumeObserver);
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
