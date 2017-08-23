<?php

namespace Biigle\Services;

use File;
use Exception;
use Biigle\Image;
use GuzzleHttp\Client;
use Symfony\Component\Finder\Finder;

/**
 * The image cache.
 */
class ImageCache
{
    /**
     * Directory of the image cache.
     *
     * @var string
     */
    protected $path;

    /**
     * Create an instance.
     */
    public function __construct()
    {
        $this->path = config('image.cache.path');
    }

    /**
     * Cache a remote image if it is not cached and get the path to the cached file.
     * If the image is not remote, nothing will be done and the path to the original
     * image will be returned.
     *
     * @param Image $image Image to get the path for
     * @throws Exception If the remote image could not be cached.
     *
     * @return string
     */
    public function get(Image $image)
    {
        if (!$image->volume->isRemote()) {
            return $image->url;
        }

        try {
            return $this->getRemoteImage($image);
        } catch (Exception $e) {
            throw new Exception("Error while caching remote image {$image->id}: {$e->getMessage()}");
        }
    }

    /**
     * Remove an image from the cache.
     *
     * @param Image $image
     */
    public function forget(Image $image)
    {
        $cachePath = $this->getCachePath($image);

        if (File::exists($cachePath)) {
            File::delete($cachePath);
        }
    }

    /**
     * Remove the least recently accessed cached remote images if the cache gets too
     * large.
     */
    public function clean()
    {
        if (!File::exists($this->path)) {
            return;
        }

        $totalSize = 0;
        $allowedSize = config('image.cache.max_size');

        $files = Finder::create()
            ->files()
            ->ignoreDotFiles(true)
            // This will return the least recently accessed images first.
            ->sortByAccessedTime()
            ->in($this->path)
            ->getIterator();

        foreach ($files as $file) {
            $totalSize += $file->getSize();
        }

        $files->rewind();

        while ($totalSize > $allowedSize && ($file = $files->current())) {
            $totalSize -= $file->getSize();
            File::delete($file->getRealPath());
            $files->next();
        }
    }

    /**
     * Cache a remote image if it is not cached and get the path to the cached file.
     *
     * @param Image $image Remote(!) image
     * @throws Exception If the remote image could not be cached.
     *
     * @return string
     */
    protected function getRemoteImage(Image $image)
    {
        $cachePath = $this->getCachePath($image);

        if (File::exists($cachePath)) {
            // Update access and modification time to signal that this cached image was
            // used recently.
            touch($cachePath);
        } else {

            $size = $this->getRemoteImageSize($image);
            if ($size > config('image.cache.max_image_size')) {
                throw new Exception("File too large with {$size} bytes.");
            }

            $this->ensurePathExists();

            // Use copy so the file is not stored to PHP memory. This way much larger
            // files can be processed.
            $success = @File::copy($image->url, $cachePath);

            if (!$success) {
                $error = error_get_last();
                throw new Exception($error['message']);
            }
        }

        return $cachePath;
    }

    /**
     * Creates the cache directory if it doesn't exist yet.
     */
    protected function ensurePathExists()
    {
        if (!File::exists($this->path)) {
            File::makeDirectory($this->path, 0755, true);
        }
    }

    /**
     * Get the path to the cached image file.
     *
     * @param Image $image
     *
     * @return string
     */
    protected function getCachePath(Image $image)
    {
        return "{$this->path}/{$image->id}";
    }

    /**
     * Get the size of the remot image in Bytes.
     *
     * @param Image $image
     *
     * @return int
     */
    protected function getRemoteImageSize(Image $image)
    {
        $client = new Client;
        $response = $client->head($image->url);
        $size = (int) $response->getHeaderLine('Content-Length');

        return ($size > 0) ? $size : INF;
    }
}
