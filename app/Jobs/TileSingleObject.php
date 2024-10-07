<?php

namespace Biigle\Jobs;

use Biigle\FileCache\Contracts\File;
use Exception;
use FilesystemIterator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Jcupitt\Vips\Image as VipsImage;
use Jcupitt\Vips;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

abstract class TileSingleObject extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

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
     * @param string $storage The path to storage-disk where the tiles should be stored
     * @param string $targetPath The path to the tiles within the permanent storage-disk
     *
     * @return void
     */
    public function __construct(string $storage, string $targetPath)
    {
        $this->storage = $storage;
        $this->targetPath = $targetPath;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    abstract protected function handle();

    /**
     * Generate tiles for the object and put them to temporary storage.
     *
     * @param File $file
     * @param string $path Path to the cached image file.
     */
    public function generateTiles($file, $path)
    {
        $vipsImage = $this->getVipsImage($path);
        $sourceSpace = Vips\FFI::vips()->vips_image_guess_interpretation($vipsImage);
        // dd($sourceSpace);

        $vipsImage->colourspace(Vips\Interpretation::RGB16)->dzsave($this->tempPath, [
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
