<?php

namespace Biigle\Listeners;

use TileCache;

class ClearTileCache
{
    /**
     * Handle the event.
     */
    public function handle()
    {
        TileCache::clear();
    }
}
