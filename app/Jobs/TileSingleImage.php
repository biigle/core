<?php

namespace Biigle\Jobs;

use File;
use VipsImage;
use Exception;
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
        if (!File::isDirectory($this->image->tilePath)) {
            File::makeDirectory($this->image->tilePath);
        }

        $this->getVipsImage()->dzsave($this->image->tilePath, ['layout' => 'zoomify']);
        $xml = simplexml_load_string(strtolower(File::get("{$this->image->tilePath}/ImageProperties.xml")));
        $this->image->setTileProperties(((array) $xml)['@attributes']);
        $this->image->tiled = true;
        $this->image->save();
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
     * @return \Jcupitt\Vips\Image
     */
    protected function getVipsImage()
    {
        return VipsImage::newFromFile($this->image->url);
    }
}
