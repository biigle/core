<?php

namespace Biigle\Services;

use File;
use Storage;
use Exception;
use Biigle\Image;
use GuzzleHttp\Client;
use InvalidArgumentException;
use League\Flysystem\Adapter\Local;
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
     * Cache a remote or cloud storage image if it is not cached and get the path to
     * the cached file. If the image is local, nothing will be done and the path to the
     * local file will be returned.
     *
     * @param Image $image Image to get the path for
     * @throws Exception If the image could not be cached.
     *
     * @return string
     */
    public function get(Image $image)
    {
        $cachePath = $this->getCachePath($image);

        if (File::exists($cachePath)) {
            // Update access and modification time to signal that this cached image was
            // used recently.
            touch($cachePath);

            return $cachePath;
        }

        try {
            if ($image->volume->isRemote()) {
                return $this->getRemoteImage($image);
            } else {
                return $this->getDiskImage($image);
            }
        } catch (Exception $e) {
            throw new Exception("Error while caching remote image {$image->id}: {$e->getMessage()}");
        }
    }

    /**
     * Get a stream resource for an image. If the image is cached, the resource points
     * to the cached file instead. This will not cache uncached images. Make sure to
     * close the streams!
     *
     * @param Image $image
     * @throws Exception If the storage disk does not exist.
     *
     * @return resource
     */
    public function getStream(Image $image)
    {
        $cachePath = $this->getCachePath($image);

        if (File::exists($cachePath)) {
            // Update access and modification time to signal that this cached image was
            // used recently.
            touch($cachePath);

            return $this->getImageStream($cachePath);
        }

        if ($image->volume->isRemote()) {
            return $this->getImageStream($image->url);
        }

        $url = explode('://', $image->url);

        if (!config("filesystems.disks.{$url[0]}")) {
            throw new Exception("Storage disk '{$url[0]}' does not exist.");
        }

        return Storage::disk($url[0])->readStream($url[1]);
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
     * Cache a remote image and get the path to the cached file.
     *
     * @param Image $image Remote image
     * @throws Exception If the image could not be cached.
     *
     * @return string
     */
    protected function getRemoteImage(Image $image)
    {
        $size = $this->getRemoteImageSize($image);
        if ($size > config('image.cache.max_image_size')) {
            throw new Exception("File too large with {$size} bytes.");
        }

        $stream = $this->getImageStream($image->url);
        $cachePath = $this->cacheFromResource($image, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return $cachePath;
    }

    /**
     * Cache an image from a storage disk and get the path to the cached file. Images
     * from local disks are not cached.
     *
     * @param Image $image Cloud storage image
     * @throws Exception If the image could not be cached.
     *
     * @return string
     */
    protected function getDiskImage(Image $image)
    {
        $url = explode('://', $image->url);

        if (!config("filesystems.disks.{$url[0]}")) {
            throw new Exception("Storage disk '{$url[0]}' does not exist.");
        }

        $disk = Storage::disk($url[0]);
        $adapter = $disk->getDriver()->getAdapter();

        // Images from the local driver are not cached.
        if ($adapter instanceof Local) {
            return $adapter->getPathPrefix().$url[1];
        }

        $size = $disk->size($url[1]);
        if ($size > config('image.cache.max_image_size')) {
            throw new Exception("File too large with {$size} bytes.");
        }

        $stream = $disk->readStream($url[1]);
        $cachePath = $this->cacheFromResource($image, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return $cachePath;
    }

    /**
     * Store the image from the given resource to a cached file.
     *
     * @param Image $image
     * @param resource $stream
     * @throws Exception If the image could not be cached.
     *
     * @return string Path to the cached file
     */
    protected function cacheFromResource(Image $image, $stream)
    {
        $this->ensurePathExists();
        $cachePath = $this->getCachePath($image);
        $success = file_put_contents($cachePath, $stream);

        if ($success === false) {
            throw new Exception('The stream resource is invalid.');
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

    /**
     * Get the stream resource for an image.
     *
     * @param string $url
     *
     * @return resource
     */
    protected function getImageStream($url)
    {
        return fopen($url);
    }
}
