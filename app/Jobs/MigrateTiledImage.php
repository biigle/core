<?php

namespace Biigle\Jobs;

use Storage;
use Exception;
use ZipArchive;
use Biigle\Image;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class MigrateTiledImage extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The image to migrate.
     *
     * @var Image
     */
    public $image;

    /**
     * Name of the storage disk that holds the ZIP files of tiled images.
     *
     * @var string
     */
    public $disk;

    /**
     * Ignore this job if the image does not exist any more.
     *
     * @var bool
     */
    protected $deleteWhenMissingModels = true;

    /**
     * Create a new job instance.
     *
     * @param Image $image The image to generate tiles for.
     *
     * @return void
     */
    public function __construct(Image $image, $disk)
    {
        $this->image = $image;
        $this->disk = $disk;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $fragment = fragment_uuid_path($this->image->uuid);
        $prefix = substr($fragment, 0, 5);
        $tmpResource = tmpfile();
        $zipResource = Storage::disk($this->disk)->readStream($fragment);
        stream_copy_to_stream($zipResource, $tmpResource);
        $tmpPath = stream_get_meta_data($tmpResource)['uri'];
        $zip = new ZipArchive;
        $zip->open($tmpPath);

        try {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                Storage::disk(config('image.tiles.disk'))
                    ->writeStream("{$prefix}/{$name}", $zip->getStream($name));
            }
        } catch (Exception $e) {
            Storage::disk(config('image.tiles.disk'))->deleteDirectory($fragment);
            throw $e;
        }
    }
}
