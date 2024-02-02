<?php

namespace Biigle\Jobs;

use Biigle\Image;
use File;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class MigrateTiledImage extends TileSingleImage
{
    /**
     * Name of the storage disk that holds the ZIP files of tiled images.
     *
     * @var string
     */
    public $disk;

    /**
     * Create a new job instance.
     *
     * @param Image $image The image to generate tiles for.
     * @param string $disk
     *
     * @return void
     */
    public function __construct(Image $image, string $disk, string $targetPath)
    {
        parent::__construct($image, $disk, $targetPath);
        $this->disk = $disk;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            $tmpResource = tmpfile();
            $zipResource = Storage::disk($this->disk)->readStream($this->targetPath);
            stream_copy_to_stream($zipResource, $tmpResource);
            $zip = new ZipArchive;
            $zip->open(stream_get_meta_data($tmpResource)['uri']);
            $zip->extractTo(config('image.tiles.tmp_dir'));
            $zip->close();
            fclose($tmpResource);
            $this->uploadToStorage();
        } finally {
            File::deleteDirectory($this->tempPath);
        }
    }
}
