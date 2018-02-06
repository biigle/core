<?php

namespace Biigle\Contracts;

use Biigle\Image;

interface ImageCache
{
    /**
     * Perform a callback with the path of a cached image. This takes care of shared
     * locks on the cached image file so it is not corrupted due to concurrent write
     * operations.
     *
     * @param Image $image
     * @param callable $callback
     *
     * @return mixed Result of the callback.
     */
    public function get(Image $image, $callback);

    /**
     * Perform a callback with the path of a cached image. Remove the cached file
     * afterwards. This takes care of shared locks on the cached image file so it is not
     * corrupted due to concurrent write operations.
     *
     * @param Image $image
     * @param callable $callback
     *
     * @return mixed Result of the callback.
     */
    public function getOnce(Image $image, $callback);

    /**
     * Get a stream resource for an image. If the image is cached, the resource points
     * to the cached file instead. This will not cache uncached images. Make sure to
     * close the streams!
     *
     * @param Image $image
     * @throws Exception If the storage disk does not exist or the file was not found.
     *
     * @return array Array containing 'stream', 'size' and 'mime' of the resource.
     */
    public function getStream(Image $image);

    /**
     * Remove the least recently accessed cached remote images if the cache gets too
     * large.
     */
    public function clean();
}
