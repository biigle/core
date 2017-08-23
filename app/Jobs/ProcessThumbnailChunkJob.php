<?php

namespace Biigle\Jobs;

use Log;
use Exception;
use VipsImage;
use ImageCache;
use Biigle\Image;
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
            $path = ImageCache::get($image);

            VipsImage::thumbnail($path, $this->width, ['height' => $this->height])
                ->writeToFile($image->thumbPath);

            // Don't actually cache remote images here because it would blow up the cache
            // if a whole large volume would be stored in there when it is created.
            ImageCache::forget($image);

        } catch (Exception $e) {
            Log::error('Could not generate thumbnail for image '.$image->id.': '.$e->getMessage());
        }
    }
}
