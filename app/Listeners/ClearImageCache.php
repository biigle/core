<?php

namespace Biigle\Listeners;

use ImageCache;

class ClearImageCache
{
    /**
     * Handle the event.
     */
    public function handle()
    {
        ImageCache::clear();
    }
}
