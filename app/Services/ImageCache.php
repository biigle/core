<?php

namespace Biigle\Services;

use File;
use Storage;
use Exception;
use SplFileInfo;
use Biigle\Image;
use GuzzleHttp\Client;
use League\Flysystem\Adapter\Local;
use Symfony\Component\Finder\Finder;
use League\Flysystem\FileNotFoundException;
use Biigle\Contracts\ImageCache as ImageCacheContract;

/**
 * The image cache.
 */
class ImageCache implements ImageCacheContract
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
     * {@inheritdoc}
     */
    public function get(Image $image, $callback)
    {
        $file = $this->cache($image);
        try {
            $result = call_user_func($callback, $image, $file['path']);
        } finally {
            fclose($file['handle']);
        }

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    public function getOnce(Image $image, $callback)
    {
        $file = $this->cache($image);
        try {
            $result = call_user_func($callback, $image, $file['path']);
        } finally {
            // Convert to exclusive lock for deletion. Don't delete if lock can't be
            // obtained.
            if (flock($file['handle'], LOCK_EX | LOCK_NB)) {
                // This path is not the same than $cachedPath for locally stored files.
                $path = $this->getCachedPath($image);
                if (File::exists($path)) {
                    File::delete($path);
                }
            }
            fclose($file['handle']);
        }

        return $result;
    }

    /**
     * {@inheritdoc}
     */
    public function getStream(Image $image)
    {
        $cachedPath = $this->getCachedPath($image);

        if (File::exists($cachedPath)) {
            // Update access and modification time to signal that this cached image was
            // used recently.
            touch($cachedPath);

            return $this->getImageStream($cachedPath);
        }

        if ($image->volume->isRemote()) {
            return $this->getImageStream($cachedPath);
        }

        $url = explode('://', $image->url);

        if (!config("filesystems.disks.{$url[0]}")) {
            throw new Exception("Storage disk '{$url[0]}' does not exist.");
        }

        try {
            return Storage::disk($url[0])->readStream($url[1]);
        } catch (FileNotFoundException $e) {
            throw new Exception($e->getMessage());
        }
    }

    /**
     * {@inheritdoc}
     */
    public function prune()
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
            $this->delete($file);
            $files->next();
        }
    }

    /**
     * Delete all unused cached files.
     */
    public function clear()
    {
        if (!File::exists($this->path)) {
            return;
        }

        $files = Finder::create()
            ->files()
            ->ignoreDotFiles(true)
            ->in($this->path)
            ->getIterator();

        foreach ($files as $file) {
            $this->delete($file);
        }
    }

    /**
     * Delete a cached file it it is not used.
     *
     * @param SplFileInfo $file
     */
    protected function delete(SplFileInfo $file)
    {
        $handle = fopen($file->getRealPath(), 'r');
        try {
            // Only delete the file if it is not currently used. Else move on.
            if (flock($handle, LOCK_EX | LOCK_NB)) {
                File::delete($file->getRealPath());
            }
        } finally {
            fclose($handle);
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
     * @return array Containing the 'path' to the file and the file 'handle'. Close the
     * handle when finished.
     */
    protected function cache(Image $image)
    {
        $cachedPath = $this->getCachedPath($image);

        // Image is already cached.
        if (File::exists($cachedPath)) {
            $handle = fopen($cachedPath, 'r');
            // This will block if the file is currently written (LOCK_EX below).
            flock($handle, LOCK_SH);
            // Update access and modification time to signal that this cached image was
            // used recently.
            touch($cachedPath);
        } else {
            $this->ensurePathExists();
            // Create and lock the file as fast as possible so concurrent workers will
            // see it. Lock it exclusively until it is completely written.
            $handle = fopen($cachedPath, 'w+');
            flock($handle, LOCK_EX);

            try {
                if ($image->volume->isRemote()) {
                    $this->getRemoteImage($image);
                } else {
                    $newCachedPath = $this->getDiskImage($image);

                    // If it is a locally stored image, delete the empty "placeholder"
                    // file again. The handle may stay open; it doesn't matter.
                    if ($newCachedPath !== $cachedPath) {
                        unlink($cachedPath);
                    }

                    $cachedPath = $newCachedPath;
                }

                // Convert the lock so other workers can use the file from now on.
                flock($handle, LOCK_SH);
            } catch (Exception $e) {
                unlink($cachedPath);
                fclose($handle);
                throw new Exception("Error while caching remote image {$image->id}: {$e->getMessage()}");
            }
        }

        return [
            'path' => $cachedPath,
            'handle' => $handle,
        ];
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
        $cachedPath = $this->cacheFromResource($image, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return $cachedPath;
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
        $cachedPath = $this->cacheFromResource($image, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return $cachedPath;
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
        $cachedPath = $this->getCachedPath($image);
        $success = file_put_contents($cachedPath, $stream);

        if ($success === false) {
            throw new Exception('The stream resource is invalid.');
        }

        return $cachedPath;
    }

    /**
     * Creates the cache directory if it doesn't exist yet.
     */
    protected function ensurePathExists()
    {
        if (!File::exists($this->path)) {
            File::makeDirectory($this->path, 0755, true, true);
        }
    }

    /**
     * Get the path to the cached image file.
     *
     * @param Image $image
     *
     * @return string
     */
    protected function getCachedPath(Image $image)
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
        return fopen($url, 'r');
    }
}
