<?php

namespace Biigle\Jobs;

use File as FileFacade;
use Biigle\FileCache\Contracts\File;
use Biigle\Image;
use Exception;
use FileCache;
use FilesystemIterator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Image as VipsImage;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class TileSingleImage extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The image to generate tiles for.
     *
     * @var File
     */
    public $file;

    /**
     * Path to the temporary storage file for the tiles.
     *
     * @var string
     */
    public $tempPath;

    /**
     * The path of the permanent storage-disk where the tiles should be stored.
     *
     * @var string
     */
    public $storage;

    /**
     * Path to the tiles within the permanent storage-disk.
     *
     * @var string
     */
    public $targetPath;

    /**
     * Ignore this job if the image does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param File $file The image to generate tiles for.
     * @param string $storage The path to storage-disk where the tiles should be stored
     * @param string targetPath The path to the tiles within the permanent storage-disk
     *
     * @return void
     */
    public function __construct(File $file, string $storage, string $targetPath)
    {
        $this->file = $file;
        $this->tempPath = config('image.tiles.tmp_dir')."/{$file->uuid}";
        // for uploadToStorage method
        $this->storage = $storage;
        $this->targetPath = $targetPath;
        $this->queue = config('image.tiles.queue');
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            FileCache::getOnce($this->file, [$this, 'generateTiles']);
            $this->uploadToStorage();
            $this->file->tilingInProgress = false;
            $this->file->save();
        } finally {
            FileFacade::deleteDirectory($this->tempPath);
        }
    }

    /**
     * Generate tiles for the image and put them to temporary storage.
     *
     * @param Image $file
     * @param string $path Path to the cached image file.
     */
    public function generateTiles($file, $path)
    {
        $this->getVipsImage($path)->dzsave($this->tempPath, [
            'layout' => 'zoomify',
            'container' => 'fs',
            'strip' => true,
        ]);
    }

    /**
     * Upload the tiles from temporary local storage to the tiles storage disk.
     */
    public function uploadToStorage()
    {
        // +1 for the connecting slash.
        $prefixLength = strlen($this->tempPath) + 1;
        $iterator = $this->getIterator($this->tempPath);
        $disk = Storage::disk($this->storage);
        try {
            foreach ($iterator as $pathname => $fileInfo) {
                $disk->putFileAs($this->targetPath, $fileInfo, substr($pathname, $prefixLength));
            }
        } catch (Exception $e) {
            $disk->deleteDirectory($this->targetPath);
            throw $e;
        }
    }

    /**
     * Get the vips image instance.
     *
     * @param string $path
     *
     * @return \Jcupitt\Vips\Image
     */
    protected function getVipsImage($path)
    {
        return VipsImage::newFromFile($path, ['access' => 'sequential']);
    }

    /**
     * Get the recursive directory iterator for the given path.
     *
     * @param string $path
     *
     * @return RecursiveIteratorIterator
     */
    protected function getIterator($path)
    {
        return new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator(
                $path,
                FilesystemIterator::KEY_AS_PATHNAME |
                    FilesystemIterator::CURRENT_AS_FILEINFO |
                    FilesystemIterator::SKIP_DOTS
            )
        );
    }
}
