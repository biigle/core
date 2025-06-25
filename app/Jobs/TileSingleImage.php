<?php

namespace Biigle\Jobs;

use Biigle\Image;
use File as FileFacade;
use FileCache;

class TileSingleImage extends TileSingleObject
{
    /**
     * The image to generate tiles for.
     *
     * @var Image
     */
    public $file;

    /**
     * Create a new job instance.
     *
     * @param Image $file The image to generate tiles for.
     * @param string $storage The path to storage-disk where the tiles should be stored
     * @param string $targetPath The path to the tiles within the permanent storage-disk
     *
     * @return void
     */
    public function __construct(Image $file, string $storage, string $targetPath)
    {
        parent::__construct($storage, $targetPath);
        $this->file = $file;
        $this->tempPath = config('image.tiles.tmp_dir')."/{$file->uuid}";
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
}
