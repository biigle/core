<?php

namespace Biigle\Services\Thumbnails;

use Log;
use Biigle\Image;
use Biigle\Volume;
use InterventionImage as IImage;
use Biigle\Contracts\ThumbnailService;
use Intervention\Image\Exception\NotReadableException;

/**
 * The default thumbnails service using the InterventionImage package
 * (http://image.intervention.io/).
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
    public static $width;

    /**
     * Maximum height to scale the thumbnails to.
     *
     * @var int
     */
    public static $height;

    /**
     * Makes a thumbnail for a single image.
     *
     * Must be public so it can be used as a callable.
     *
     * @param Image $image
     */
    public static function makeThumbnail(Image $image)
    {
        try {
            IImage::make($image->url)
                ->resize(static::$width, static::$height, function ($constraint) {
                    // resize images proportionally
                    $constraint->aspectRatio();
                })
                ->encode(config('thumbnails.format'))
                ->save($image->thumbPath)
                // free memory; very important for scaling 1000s of images!!
                ->destroy();
        } catch (NotReadableException $e) {
            Log::error('Could not generate thumbnail for image '.$image->id.': '.$e->getMessage());
        }
    }

    /**
     * {@inheritdoc}
     */
    public function generateThumbnails(Volume $volume, array $only)
    {
        $memoryLimit = ini_get('memory_limit');

        // increase memory limit for resizing large images
        ini_set('memory_limit', self::MEMORY_LIMIT);
        // set dimensions once, so config() is not called for every image
        static::$width = config('thumbnails.width');
        static::$height = config('thumbnails.height');

        $query = $volume->images()->when($only, function ($query) use ($only) {
            return $query->whereIn('id', $only);
        });

        // process the images, 100 at a time
        $query->chunk(100, function ($images) {
            $images->map([self::class, 'makeThumbnail']);
        });

        // restore default memory limit
        ini_set('memory_limit', $memoryLimit);
    }
}
