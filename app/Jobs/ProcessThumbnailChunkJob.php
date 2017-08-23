<?php

namespace Biigle\Jobs;

use Log;
use File;
use VipsImage;
use Biigle\Image;
use ErrorException;
use Jcupitt\Vips\Exception;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

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

        foreach ($this->images as $image) {
            $this->makeThumbnail($image);
        }
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
            if ($image->volume->isRemote()) {
                // Don't cache remote images here because it would blow up the cache
                // if a whole large volume would be stored in there when it is created.
                $path = tempnam(sys_get_temp_dir(), 'biigle_image_'.$image->id);
                copy($image->url, $path);
            } else {
                $path = $image->url;
            }

            VipsImage::thumbnail($path, $this->width, ['height' => $this->height])
                ->writeToFile($image->thumbPath);

        } catch (Exception $e) {
            $this->handleThumbnailError($image, $e);
        } catch (ErrorException $e) {
            $this->handleThumbnailError($image, $e);
        }
    }

    /**
     * Handle an error during thumbnail generation
     *
     * @param Image $image
     * @param \Exception $exception
     */
    protected function handleThumbnailError(Image $image, $exception)
    {
        Log::error('Could not generate thumbnail for image '.$image->id.': '.$exception->getMessage());
    }
}
