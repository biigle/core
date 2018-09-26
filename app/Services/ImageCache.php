<?php

namespace Biigle\Services;

use File;
use Storage;
use Exception;
use SplFileInfo;
use Biigle\Image;
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
        $file = $this->retrieve($image);
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
        $file = $this->retrieve($image);
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

        // Prune images by age.
        $now = time();
        // Allowed age in seconds.
        $allowedAge = config('image.cache.max_age') * 60;
        $totalSize = 0;

        $files = Finder::create()
            ->files()
            ->ignoreDotFiles(true)
            ->in($this->path)
            ->getIterator();

        foreach ($files as $file) {
            if ($now - $file->getATime() > $allowedAge) {
                $this->delete($file);
            } else {
                $totalSize += $file->getSize();
            }
        }

        // Prune images by cache size.
        $allowedSize = config('image.cache.max_size');

        if ($totalSize > $allowedSize) {
            $files = Finder::create()
                ->files()
                ->ignoreDotFiles(true)
                // This will return the least recently accessed images first.
                ->sortByAccessedTime()
                ->in($this->path)
                ->getIterator();

            while ($totalSize > $allowedSize && ($file = $files->current())) {
                $totalSize -= $file->getSize();
                $this->delete($file);
                $files->next();
            }
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
    protected function retrieve(Image $image)
    {
        $this->ensurePathExists();
        $cachedPath = $this->getCachedPath($image);

        // This will return false if the file already exists. Else it will create it in
        // read and write mode.
        $handle = @fopen($cachedPath, 'x+');

        if ($handle === false) {
            // The file exists, get the file handle in read mode.
            $handle = fopen($cachedPath, 'r');
            // Wait for any LOCK_EX that is set if the file is currently written.
            flock($handle, LOCK_SH);

            // Check if the file is still there since the writing operation could have
            // failed. If the file is gone, retry retrieve.
            if (fstat($handle)['nlink'] === 0) {
                fclose($handle);
                return $this->retrieve($image);
            }

            // The file exists and is no longer written to.
            return $this->retrieveExistingFile($cachedPath, $handle);
        }

        // The file did not exist and should be written. Hold LOCK_EX until writing
        // finished.
        flock($handle, LOCK_EX);

        try {
            $fileInfo = $this->retrieveNewFile($image, $cachedPath, $handle);
            // Convert the lock so other workers can use the file from now on.
            flock($handle, LOCK_SH);
        } catch (Exception $e) {
            // Remove the empty file if writing failed. This is the case that is caught
            // by 'nlink' === 0 above.
            unlink($cachedPath);
            fclose($handle);
            throw new Exception("Error while caching image {$image->id}: {$e->getMessage()}");
        }

        return $fileInfo;
    }

    /**
     * Get path and handle for a file that exists in the cache.
     *
     * @param string $cachedPath
     * @param resource $handle
     *
     * @return array
     */
    protected function retrieveExistingFile($cachedPath, $handle)
    {
        // Update access and modification time to signal that this cached image was
        // used recently.
        touch($cachedPath);

        return [
            'path' => $cachedPath,
            'handle' => $handle,
        ];
    }

    /**
     * Get path and handle for a file that does not yet exist in the cache.
     *
     * @param Image $image
     * @param string $cachedPath
     * @param resource $handle
     *
     * @return array
     */
    protected function retrieveNewFile(Image $image, $cachedPath, $handle)
    {
        if ($image->volume->isRemote()) {
            $this->getRemoteImage($image, $handle);
        } else {
            $newCachedPath = $this->getDiskImage($image, $handle);

            // If it is a locally stored image, delete the empty "placeholder"
            // file again. The handle may stay open; it doesn't matter.
            if ($newCachedPath !== $cachedPath) {
                unlink($cachedPath);
            }

            $cachedPath = $newCachedPath;
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
     * @param resource $target Target file resource
     * @throws Exception If the image could not be cached.
     *
     * @return string
     */
    protected function getRemoteImage(Image $image, $target)
    {
        $context = stream_context_create(['http' => [
            'timeout' => config('image.cache.timeout'),
        ]]);
        $source = $this->getImageStream($image->url, $context);
        $cachedPath = $this->cacheFromResource($image, $source, $target);
        if (is_resource($source)) {
            fclose($source);
        }

        return $cachedPath;
    }

    /**
     * Cache an image from a storage disk and get the path to the cached file. Images
     * from local disks are not cached.
     *
     * @param Image $image Cloud storage image
     * @param resource $target Target file resource
     * @throws Exception If the image could not be cached.
     *
     * @return string
     */
    protected function getDiskImage(Image $image, $target)
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

        $source = $disk->readStream($url[1]);
        $cachedPath = $this->cacheFromResource($image, $source, $target);
        if (is_resource($source)) {
            fclose($source);
        }

        return $cachedPath;
    }

    /**
     * Store the image from the given resource to a cached file.
     *
     * @param Image $image
     * @param resource $source
     * @param resource $target
     * @throws Exception If the image could not be cached.
     *
     * @return string Path to the cached file
     */
    protected function cacheFromResource(Image $image, $source, $target)
    {
        if (!is_resource($source)) {
            throw new Exception('The source resource could not be established.');
        }

        $cachedPath = $this->getCachedPath($image);
        $maxBytes = intval(config('image.cache.max_image_size'));
        $bytes = stream_copy_to_stream($source, $target, $maxBytes);

        if ($bytes === $maxBytes) {
            throw new Exception("The file is too large with more than {$maxBytes} bytes.");
        }

        if ($bytes === false) {
            throw new Exception('The source resource is invalid.');
        }

        if (stream_get_meta_data($source)['timed_out']) {
            throw new Exception('The source stream timed out while reading data.');
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
     * Get the stream resource for an image.
     *
     * @param string $url
     * @param resource|null $context Stream context
     *
     * @return resource
     */
    protected function getImageStream($url, $context = null)
    {
        if (is_resource($context)) {
            return @fopen($url, 'r', false, $context);
        }

        return @fopen($url, 'r');
    }
}
