<?php

namespace Biigle\Modules\Largo\Jobs;

use Biigle\Contracts\Annotation;
use Biigle\Shape;
use Biigle\VolumeFile;
use Exception;
use FileCache;
use Storage;
use VipsImage;

class GenerateImageAnnotationPatch extends GenerateAnnotationPatch
{
    /**
     * Handle a single image.
     *
     * @param VolumeFile $file
     * @param string $path Path to the cached image file.
     */
    public function handleFile(VolumeFile $file, $path)
    {
        // Do not get the path in the constructor because that would require fetching all
        // the images of the annotations. This would be really slow when lots of
        // annotation patchs should be generated.
        $targetPath = $this->getTargetPath($this->annotation);

        $thumbWidth = config('thumbnails.width');
        $thumbHeight = config('thumbnails.height');

        $image = $this->getVipsImage($path);
        $rect = $this->getPatchRect($this->annotation, $thumbWidth, $thumbHeight);
        $rect = $this->makeRectContained($rect, $image);

        $buffer = $image->crop(
                $rect['left'],
                $rect['top'],
                $rect['width'],
                $rect['height']
            )
            ->resize(floatval($thumbWidth) / $rect['width'])
            ->writeToBuffer('.'.config('largo.patch_format'), [
                'Q' => 85,
                'strip' => true,
            ]);

        Storage::disk($this->targetDisk)->put($targetPath, $buffer);
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
        $points = $annotation->getPoints();

        switch ($annotation->getShape()->id) {
            case Shape::pointId():
                $pointPadding = config('largo.point_padding');
                $left = $points[0] - $pointPadding;
                $right = $points[0] + $pointPadding;
                $top = $points[1] - $pointPadding;
                $bottom = $points[1] + $pointPadding;
                break;

            case Shape::circleId():
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

        // Ensure the minimum width so the annotation patch is not "zoomed in".
        if ($width < $thumbWidth) {
            $delta = ($thumbWidth - $width) / 2.0;
            $left -= $delta;
            $right += $delta;
            $width = $thumbWidth;
        }

        // Ensure the minimum height so the annotation patch is not "zoomed in".
        if ($height < $thumbHeight) {
            $delta = ($thumbHeight - $height) / 2.0;
            $top -= $delta;
            $bottom += $delta;
            $height = $thumbHeight;
        }

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

    /**
     * Adjust the position and size of the patch rectangle so it is contained in the
     * image.
     *
     * @param array $rect
     * @param Jcupitt\Vips\Image $image
     *
     * @return array
     */
    protected function makeRectContained($rect, $image)
    {
        // Order of min max is importans so the point gets no negative coordinates.
        $rect['left'] = min($image->width - $rect['width'], $rect['left']);
        $rect['left'] = max(0, $rect['left']);
        $rect['top'] = min($image->height - $rect['height'], $rect['top']);
        $rect['top'] = max(0, $rect['top']);

        // Adjust dimensions of rect if it is larger than the image.
        $rect['width'] = min($image->width, $rect['width']);
        $rect['height'] = min($image->height, $rect['height']);

        return $rect;
    }

    /**
     * Assemble the target path for an annotation patch.
     *
     * @param Annotation $annotation
     *
     * @return string
     */
    protected function getTargetPath(Annotation $annotation): string
    {
        $prefix = fragment_uuid_path($annotation->getFile()->uuid);
        $format = config('largo.patch_format');

        return "{$prefix}/{$annotation->id}.{$format}";
    }
}
