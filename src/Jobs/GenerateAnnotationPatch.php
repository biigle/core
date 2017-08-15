<?php

namespace Biigle\Modules\Largo\Jobs;

use File;
use Cache;
use VipsImage;
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
    private $annotationId;

    /**
     * Create a new job instance.
     *
     * @param Annotation $annotation
     *
     * @return void
     */
    public function __construct(Annotation $annotation)
    {
        // take only the ID and not the annotation because the annotation may already be
        // deleted when this job runs and the job would fail!
        $this->annotationId = $annotation->id;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $annotation = Annotation::with('image.volume')->find($this->annotationId);
        // annotation may have been deleted in the meantime
        if ($annotation === null) {
            return;
        }

        $image = $annotation->image;
        $prefix = config('largo.patch_storage').'/'.$image->volume_id;
        $format = config('largo.patch_format');
        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');
        $rect = $this->getPatchRect($annotation, $thumbWidth, $thumbHeight);

        if (!File::exists($prefix)) {
            // make recursive
            File::makeDirectory($prefix, 0755, true);
        }

        $vipsImage = $this->getVipsImage($image);
        $vipsImage->crop($rect['left'], $rect['top'], $rect['width'], $rect['height'])
            ->resize(floatval($thumbWidth) / $rect['width'])
            ->writeToFile("{$prefix}/{$annotation->id}.{$format}");
    }

    /**
     * Get the vips image instance.
     *
     * @param Image $image
     *
     * @return \Jcupitt\Vips\Image
     */
    protected function getVipsImage(Image $image)
    {
        if ($image->volume->isRemote()) {
            $buffer = Cache::remember("remote-image-buffer-{$image->id}", config('largo.imagecache_lifetime'), function () use ($image) {
               return @file_get_contents($image->url);
            });
            return VipsImage::newFromBuffer($buffer);
        }

        return VipsImage::newFromFile($image->url);
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
