<?php

namespace Biigle\Facades;

use Illuminate\Support\Facades\Facade;

class TileCache extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    protected static function getFacadeAccessor()
    {
        return 'tile-cache';
    }
}
