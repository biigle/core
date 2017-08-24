<?php

namespace Biigle\Jobs;

use File;
use VipsImage;
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

        VipsImage::newFromFile($this->image->url)->dzsave($this->image->tilePath, ['layout' => 'zoomify']);
        $this->image->update(['tiled' => true]);
    }
}
