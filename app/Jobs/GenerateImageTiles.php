<?php

namespace Biigle\Jobs;

use File;
use Queue;
use VipsImage;
use Biigle\Image;
use Biigle\Volume;
use Jcupitt\Vips\Exception;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateImageTiles extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The volume for which the images should be checked.
     *
     * @var Volume
     */
    private $volume;

    /**
     * Array of image IDs to restrict the job to.
     * If it is empty, all images of the volume will be taken.
     *
     * @var array
     */
    private $only;

    /**
     * Create a new job instance.
     *
     * @param Volume $volume The volume for which the images should be checked.
     * @param array $only Array of image IDs to restrict the job to.
     *
     * @return void
     */
    public function __construct(Volume $volume, array $only = [])
    {
        $this->volume = $volume;
        $this->only = $only;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        // Not supported for remote volumes.
        if ($this->volume->isRemote()) {
            return;
        }

        $images = $this->volume->images()
            ->select('id', 'filename')
            ->when($this->only, function ($query) {
                return $query->whereIn('id', $this->only);
            })
            ->get()
            // Manually assign volume here so it is not fetched again later for each
            // image when $image->url is called.
            ->each(function ($image) {
                $image->setRelation('volume', $this->volume);
            });

        $threshold = config('image.tiles.threshold');

        foreach ($images as $image) {
            if ($this->shouldBeTiled($image, $threshold)) {
                Queue::push(new TileSingleImage($image));
            }
        }
    }

    /**
     * Determine if an image should be tiled.
     *
     * @param Image $image
     * @param int $threshold
     *
     * @return bool
     */
    protected function shouldBeTiled(Image $image, $threshold)
    {
        if (File::exists($image->url)) {
            if (!$image->tiled || !File::isDirectory($image->tilePath)) {
                try {
                    $i = VipsImage::newFromFile($image->url);
                } catch (Exception $e) {
                    return false;
                }

                return $i->width > $threshold || $i->height > $threshold;
            }
        }

        return false;
    }
}
