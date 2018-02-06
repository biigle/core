<?php

namespace Biigle\Facades;

use Illuminate\Support\Facades\Facade;
use Biigle\Support\Testing\Fakes\ImageCacheFake;

class ImageCache extends Facade
{
    /**
     * Use testing instance.
     *
     * @return void
     */
    public static function fake()
    {
        static::swap(new ImageCacheFake(static::getFacadeApplication()));
    }

    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    protected static function getFacadeAccessor()
    {
        return 'image-cache';
    }
}
