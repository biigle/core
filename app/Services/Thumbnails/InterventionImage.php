<?php

namespace Dias\Services\Thumbnails;

use Dias\Contracts\ThumbnailService;
use Dias\Transect;
use Dias\Image;
use InterventionImage as IImage;

/**
 * The default Dias thumbnails service using the InterventionImage package
 * (http://image.intervention.io/)
 */
class InterventionImage implements ThumbnailService
{
    /**
     * Memory limit to set during resizing the images.
     *
     * @var string
     */
    const MEMORY_LIMIT = '512M';

    /**
     * Maximum width to scale the thumbnails to.
     *
     * @var int
     */
    private static $width;

    /**
     * Maximum height to scale the thumbnails to.
     *
     * @var int
     */
    private static $height;

    /**
     * Makes a thumbnail for a single image.
     *
     * Must be public so it can be used as a callable.
     *
     * @param Image $image
     */
    public static function makeThumbnail(Image $image) {
        IImage::make($image->url)
            ->resize(static::$width, static::$height, function ($constraint) {
                // resize images proportionally
                $constraint->aspectRatio();
            })
            ->encode('jpg')
            ->save($image->thumbPath)
            // free memory; very important for scaling 1000s of images!!
            ->destroy();
    }

    /**
     * {@inheritDoc}
     */
    public function generateThumbnails(Transect $transect) {
        $memoryLimit = ini_get('memory_limit');

        // increase memory limit for resizing large images
        ini_set('memory_limit', self::MEMORY_LIMIT);
        // set dimensions once, so config() is not called for every image
        static::$width = config('thumbnails.width');
        static::$height = config('thumbnails.height');

        // process the images, 100 at a time
        $transect->images()->chunk(100, function ($images) {
            $images->map([static::class, 'makeThumbnail']);
        });

        // restore default memory limit
        ini_set('memory_limit', $memoryLimit);
    }
}
