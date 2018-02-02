<?php

namespace Biigle\Jobs;

use File;
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
     * Create a new job instance.
     *
     * @param Image $image The image to generate tiles for.
     *
     * @return void
     */
    public function __construct(Image $image)
    {
        $this->image = $image;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        ImageCache::doWithOnce($this->image, [$this, 'handleImage']);
    }

    public function handleImage(Image $image, $path)
    {
        if (!File::isDirectory($image->tilePath)) {
            File::makeDirectory($image->tilePath);
        }
        $this->getVipsImage($path)->dzsave($image->tilePath, ['layout' => 'zoomify']);
        $xml = simplexml_load_string(strtolower(File::get("{$image->tilePath}/ImageProperties.xml")));
        $xml = ((array) $xml)['@attributes'];
        $image->setTileProperties(array_map('intval', $xml));
        $image->tiled = true;
        $image->save();
    }

    /**
     * The job failed to process.
     *
     * @param  Exception  $exception
     * @return void
     */
    public function failed(Exception $exception)
    {
        File::deleteDirectory($this->image->tilePath);

        throw $exception;
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
        return VipsImage::newFromFile($path);
    }
}
