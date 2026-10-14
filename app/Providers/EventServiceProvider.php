<?php

namespace Biigle\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

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
            \Biigle\Listeners\CleanupImageAnnotations::class,
        ],
        \Biigle\Events\TiledImagesDeleted::class => [
            \Biigle\Listeners\CleanupImageTiles::class,
        ],
        \Biigle\Events\VideosDeleted::class => [
            \Biigle\Listeners\CleanupVideoThumbnails::class,
            \Biigle\Listeners\CleanupVideoAnnotations::class,
        ],
        \Biigle\Events\AnnotationLabelAttached::class => [
            \Biigle\Listeners\AttachLabelListener::class,
        ],
        \Biigle\Events\VolumeCloned::class => [
            \Biigle\Listeners\VolumeClonedListener::class,
        ],
    ];

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
