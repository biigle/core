<?php

namespace Biigle\Jobs;

use Log;
use File;
use Biigle\Image;
use InterventionImage as IImage;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Intervention\Image\Exception\NotReadableException;

class ProcessThumbnailChunkJob extends Job implements ShouldQueue
{
    use InteractsWithQueue, SerializesModels;

    /**
     * The images to generate thumbnails for.
     *
     * Public for testability.
     *
     * @var Collection
     */
    public $images;

    /**
     * The desired thumbnail width.
     *
     * @var int
     */
    protected $width;

    /**
     * The desired thumbnail height.
     *
     * @var int
     */
    protected $height;

    /**
     * The desired thumbnail file format.
     *
     * @var int
     */
    protected $format;

    /**
     * Create a new job instance.
     *
     * @param Collection $images The images to generate thumbnails for.
     *
     * @return void
     */
    public function __construct($images)
    {
        $this->images = $images;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $this->width = config('thumbnails.width');
        $this->height = config('thumbnails.height');
        $this->format = config('thumbnails.format');

        $memoryLimit = ini_get('memory_limit');
        // increase memory limit for resizing large images
        ini_set('memory_limit', config('thumbnails.memory_limit'));

        foreach ($this->images as $image) {
            $this->makeThumbnail($image);
        }

        // restore default memory limit
        ini_set('memory_limit', $memoryLimit);
    }

    /**
     * Makes a thumbnail for a single image.
     *
     * @param Image $image
     */
    protected function makeThumbnail(Image $image)
    {
        // Skip existing thumbnails.
        if (File::exists($image->thumbPath)) {
            return;
        }

        try {
            File::makeDirectory(File::dirname($image->thumbPath), 0755, true, true);

            IImage::make($image->url)
                ->resize($this->width, $this->height, function ($constraint) {
                    // resize images proportionally
                    $constraint->aspectRatio();
                })
                ->encode($this->format)
                ->save($image->thumbPath)
                // free memory; very important for scaling 1000s of images!!
                ->destroy();
        } catch (NotReadableException $e) {
            Log::error('Could not generate thumbnail for image '.$image->id.': '.$e->getMessage());
        }
    }
}
