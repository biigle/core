<?php

namespace Biigle\Services;

use File;
use Storage;
use PharData;
use Exception;
use Biigle\Image;
use Symfony\Component\Finder\Finder;
use Illuminate\Contracts\Filesystem\FileNotFoundException;

/**
 * The image tile cache.
 */
class TileCache
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
        $this->path = config('image.tiles.cache.path');
    }

    /**
     * Cache image tiles for an image if they are not alerady cached.
     *
     * @param Image $image
     *
     * @return mixed Path to the cached image tile directory or false if the image tiles do not exist.
     */
    public function get(Image $image)
    {
        $fragment = fragment_uuid_path($image->uuid);
        $cachedPath = "{$this->path}/{$fragment}";

        if (File::exists($cachedPath)) {
            // Update the modification time of the files to mark the image tiles as
            // recently used.
            touch("{$cachedPath}/ImageProperties.xml");
        } else {
            $this->ensureDirectoryExists($cachedPath);
            try {
                $disk = Storage::disk(config('image.tiles.disk'));
                try {
                    File::put("{$cachedPath}.tar.gz", $disk->readStream("{$fragment}.tar.gz"), LOCK_EX);
                } catch (FileNotFoundException $e) {
                    return false;
                }

                $archive = new PharData("{$cachedPath}.tar.gz");
                $archive->extractTo($cachedPath);
            } finally {
                File::delete("{$cachedPath}.tar.gz");
            }
        }

        return $cachedPath;
    }

    /**
     * Remove old cached image tiles if the cache got bigger than the allowed size.
     */
    public function prune()
    {
        if (!File::exists($this->path)) {
            return;
        }

        $totalSize = 0;
        $allowedSize = config('image.tiles.cache.max_size');

        $files = Finder::create()
            ->name('ImageProperties.xml')
            // This will return the least recently accessed image tiles first.
            ->sortByAccessedTime()
            ->in($this->path)
            ->getIterator();

        $sizes = [];

        foreach ($files as $file) {
            $path = $file->getPath();
            $sizes[$path] = $this->getDirectorySize($path);
            $totalSize += $sizes[$path];
        }

        $files->rewind();

        while ($totalSize > $allowedSize && ($file = $files->current())) {
            $path = $file->getPath();
            File::deleteDirectory($path);
            $totalSize -= $sizes[$path];
            $files->next();
        }
    }

    /**
     * Delete all cached tiles.
     */
    public function clear()
    {
        $files = Finder::create()
            ->directories()
            ->in($this->path)
            ->ignoreDotFiles(true)
            ->depth(0)
            ->getIterator();

        foreach ($files as $file) {
            File::deleteDirectory($file->getRealPath());
        }
    }

    /**
     * Creates the subdirectories that are required by the given path to the cached
     * tiles.
     *
     * @param string $cachedPath
     */
    protected function ensureDirectoryExists($cachedPath)
    {
        File::makeDirectory(File::dirname($cachedPath), 0755, true, true);
    }

    /**
     * Returns the size of the directory and all contents in bytes.
     *
     * @param string $dir
     *
     * @return int
     */
    protected function getDirectorySize($dir)
    {
        // du is the simplest and fastest method to get the size of a directory with
        // lots of files. This shows the size in kilobytes.
        $output = exec("/usr/bin/du -sk '{$dir}'");

        return intval(explode("\t", $output)[0]) * 1000;
    }
}
