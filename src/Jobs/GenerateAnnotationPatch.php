<?php

namespace Biigle\Modules\Largo\Jobs;

use Log;
use File;
use Exception;
use VipsImage;
use ImageCache;
use Biigle\Image;
use Biigle\Shape;
use Biigle\Jobs\Job;
use Biigle\Annotation;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class GenerateAnnotationPatch extends Job implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The ID of the annotation to generate a patch for.
     *
     * @var int
     */
    protected $id;

    /**
     * The annotation that is set when the job is processed.
     *
     * @var Annotation
     */
    protected $annotation;

    /**
     * Create a new job instance.
     *
     * @param Annotation $annotation
     *
     * @return void
     */
    public function __construct(Annotation $annotation)
    {
        // Take only the ID and not the annotation because the annotation may already be
        // deleted when this job runs and the job would fail!
        $this->id = $annotation->id;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $this->annotation = Annotation::with('image.volume')->find($this->id);
        // Annotation may have been deleted in the meantime.
        if ($this->annotation === null) {
            return;
        }

        try {
            ImageCache::get($this->annotation->image, [$this, 'handleImage']);
        } catch (Exception $e) {
            Log::error("Could not generate annotation patch for annotation {$this->id}: {$e->getMessage()}");
        }
    }

    /**
     * Handle a single image
     *
     * @param Image $image
     * @param string $path Path to the cached image file.
     */
    public function handleImage(Image $image, $path)
    {
        $prefix = config('largo.patch_storage').'/'.$image->volume_id;
        $format = config('largo.patch_format');
        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');
        $rect = $this->getPatchRect($this->annotation, $thumbWidth, $thumbHeight);

        if (!File::exists($prefix)) {
            // make recursive
            File::makeDirectory($prefix, 0755, true);
        }

        $this->getVipsImage($path)
            ->crop($rect['left'], $rect['top'], $rect['width'], $rect['height'])
            ->resize(floatval($thumbWidth) / $rect['width'])
            ->writeToFile("{$prefix}/{$this->id}.{$format}");
    }

    /**
     * Get the vips image instance.
     *
     * @param string $path
     *
     * @return \Jcupitt\Vips\Image
     */
    protected function getVipsImage($path)
    {
        return VipsImage::newFromFile($path, ['access' => 'sequential']);
    }

    /**
     * Calculate the bounding rectangle of the patch to extract.
     *
     * @param Annotation $annotation
     * @param int $thumbWidth
     * @param int $thumbHeight
     *
     * @return array Containing width, height, top and left
     */
    protected function getPatchRect(Annotation $annotation, $thumbWidth, $thumbHeight)
    {
        $padding = config('largo.patch_padding');
        $points = $annotation->points;

        switch ($annotation->shape_id) {
            case Shape::$pointId:
                $pointPadding = config('largo.point_padding');
                $left = $points[0] - $pointPadding;
                $right = $points[0] + $pointPadding;
                $top = $points[1] - $pointPadding;
                $bottom = $points[1] + $pointPadding;
                break;

            case Shape::$circleId:
                $left = $points[0] - $points[2];
                $right = $points[0] + $points[2];
                $top = $points[1] - $points[2];
                $bottom = $points[1] + $points[2];
                break;

            default:
                $left = INF;
                $right = -INF;
                $top = INF;
                $bottom = -INF;
                foreach ($points as $index => $value) {
                    if ($index % 2 === 0) {
                        $left = min($left, $value);
                        $right = max($right, $value);
                    } else {
                        $top = min($top, $value);
                        $bottom = max($bottom, $value);
                    }
                }
        }

        $left -= $padding;
        $right += $padding;
        $top -= $padding;
        $bottom += $padding;

        $width = $right - $left;
        $height = $bottom - $top;

        $widthRatio = $width / $thumbWidth;
        $heightRatio = $height / $thumbHeight;

        // increase the size of the patch so its aspect ratio is the same than the
        // ratio of the thumbnail dimensions
        if ($widthRatio > $heightRatio) {
            $newHeight = round($thumbHeight * $widthRatio);
            $top -= round(($newHeight - $height) / 2);
            $height = $newHeight;
        } else {
            $newWidth = round($thumbWidth * $heightRatio);
            $left -= round(($newWidth - $width) / 2);
            $width = $newWidth;
        }

        return [
            'width' => intval(round($width)),
            'height' => intval(round($height)),
            'left' => intval(round($left)),
            'top' => intval(round($top)),
        ];
    }
}
