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
use League\Flysystem\FileNotFoundException;

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
     * Perform a callback with the path of a cached image. This takes care of shared
     * locks on the cached image file so it is not corrupted due to concurrent write
     * operations.
     *
     * @param Image $image
     * @param callable $callback
     *
     * @return mixed Result of the callback.
     */
    public function doWith(Image $image, $callback)
    {
        $cachedPath = $this->get($image);
        $handle = fopen($cachedPath, 'r');
        // This blocks if the file is still written to with LOCK_EX.
        flock($handle, LOCK_SH);
        $result = call_user_func($callback, $image, $cachedPath);
        // Release lock.
        fclose($handle);

        return $result;
    }

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
    public function doWithOnce(Image $image, $callback)
    {
        $result = $this->doWith($image, $callback);
        $this->forget($image);

        return $result;
    }

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
    public function getStream(Image $image)
    {
        $cachePath = $this->getCachePath($image);

        if (File::exists($cachePath)) {
            // Update access and modification time to signal that this cached image was
            // used recently.
            touch($cachePath);

            return [
                'stream' => $this->getImageStream($cachePath),
                'size' => File::size($cachePath),
                'mime' => File::mimeType($cachePath),
            ];
        }

        if ($image->volume->isRemote()) {
            $headers = $this->getRemoteImageHeaders($image);

            return [
                'stream' => $this->getImageStream($image->url),
                'size' => $headers['Content-Length'][0],
                'mime' => $headers['Content-Type'][0],
            ];
        }

        $url = explode('://', $image->url);

        if (!config("filesystems.disks.{$url[0]}")) {
            throw new Exception("Storage disk '{$url[0]}' does not exist.");
        }

        try {
            return [
                'stream' => Storage::disk($url[0])->readStream($url[1]),
                'size' => Storage::disk($url[0])->getSize($url[1]),
                'mime' => Storage::disk($url[0])->getMimetype($url[1]),
            ];
        } catch (FileNotFoundException $e) {
            throw new Exception($e->getMessage());
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
     * Cache a remote or cloud storage image if it is not cached and get the path to
     * the cached file. If the image is local, nothing will be done and the path to the
     * local file will be returned.
     *
     * @param Image $image Image to get the path for
     * @throws Exception If the image could not be cached.
     *
     * @return string
     */
    protected function get(Image $image)
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
     * Remove an image from the cache.
     *
     * @param Image $image
     */
    protected function forget(Image $image)
    {
        $cachePath = $this->getCachePath($image);
        $handle = @fopen($cachePath, 'r');

        if (is_resource($handle)) {
            // Only remove the file if nobody else is using it.
            if (flock($handle, LOCK_EX|LOCK_NB)) {
                File::delete($cachePath);
            }
            fclose($handle);
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
        // Acquire lock that can be checked in ImageCache::has. Also this prevents that
        // multiple workers write to the file at the same time.
        $success = file_put_contents($cachePath, $stream, LOCK_EX);

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
        $headers = $this->getRemoteImageHeaders($image);
        $size = (int) $headers['Content-Length'][0];

        return ($size > 0) ? $size : INF;
    }

    protected function getRemoteImageHeaders(Image $image)
    {
        $client = new Client;
        $response = $client->head($image->url);

        return $response->getHeaders();
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
        return fopen($url, 'r');
    }
}
