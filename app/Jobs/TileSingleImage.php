<?php

namespace Biigle\Jobs;

use File;
use Storage;
use VipsImage;
use Exception;
use ImageCache;
use Biigle\Image;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class TileSingleImage extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The image to generate tiles for.
     *
     * @var Image
     */
    public $image;

    /**
     * Path to the temporary storage directory for the tiles.
     *
     * @var string
     */
    public $tempPath;

    /**
     * Create a new job instance.
     *
     * @param Image $image The image to generate tiles for.
     *
     * @return void
     */
    public function __construct(Image $image)
    {
        $this->image = $image;
        $this->tempPath = config('image.tiles.tmp_dir')."/biigle_tiles_{$image->uuid}";
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            ImageCache::getOnce($this->image, [$this, 'generateTiles']);
            $this->uploadToStorage();
            $this->storeTileProperties();
        } finally {
            File::deleteDirectory($this->tempPath);
        }
    }

    /**
     * Generate tiles for the image and put them to temporary storage.
     *
     * @param Image $image
     * @param string $path Path to the cached image file.
     */
    public function generateTiles(Image $image, $path)
    {
        if (!File::isDirectory($this->tempPath)) {
            File::makeDirectory($this->tempPath);
        }
        $this->getVipsImage($path)->dzsave($this->tempPath, ['layout' => 'zoomify']);
    }

    /**
     * Upload the tiles from temporary local storage to the tiles storage disk.
     */
    public function uploadToStorage()
    {
        $fragment = fragment_uuid_path($this->image->uuid);
        $files = File::allFiles($this->tempPath);
        $disk = Storage::disk(config('image.tiles.disk'));

        foreach ($files as $file) {
            $path = File::dirname($file->getRelativePathname());
            $disk->putFileAs("{$fragment}/{$path}", $file, $file->getFilename());
        }
    }

    /**
     * Store the properties of the tiled image in the DB.
     */
    public function storeTileProperties()
    {
        $xml = simplexml_load_string(strtolower(File::get("{$this->tempPath}/ImageProperties.xml")));
        $xml = ((array) $xml)['@attributes'];
        $this->image->setTileProperties(array_map('intval', $xml));
        $this->image->tiled = true;
        $this->image->save();
    }

    /**
     * Get the vips image instance
     *
     * @param string $path
     *
     * @return \Jcupitt\Vips\Image
     */
    protected function getVipsImage($path)
    {
        return VipsImage::newFromFile($path, ['access' => 'sequential']);
    }
}
