<?php

namespace Biigle\Jobs;

use Biigle\Enums\Shape;
use Biigle\VideoAnnotation;
use Biigle\VolumeFile;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Jcupitt\Vips\Image as VipsImage;

abstract class GenerateFeatureVectors extends Job implements ShouldQueue
{
    /**
     * Size of a square input patch for generating feature vectors with DINO.
     *
     * @var int
     */
    const DINO_PATCH_SIZE = 224;

    /**
     * Get the bounding box of an annotation
     *
     * @param int $pointPadding The default is half the patch size of 224 that is expected by DINO.
     * @param int $minSize Each side of the box should have at least this number of pixels. Must be divisible by 2.
     */
    public function getAnnotationBoundingBox(
        array $points,
        Shape $shape,
        int $pointPadding = self::DINO_PATCH_SIZE / 2,
        int $boxPadding = 0,
        int $minSize = 32
    ): array {
        $box = match ($shape) {
            Shape::POINT => $this->getPointBoundingBox($points, $pointPadding),
            Shape::CIRCLE => $this->getCircleBoundingBox($points),
            Shape::ELLIPSE => $this->getEllipseBoundingBox($points),
            default => $this->getPolygonBoundingBox($points),
        };

        if ($boxPadding > 0) {
            $box = [
                $box[0] - $boxPadding,
                $box[1] - $boxPadding,
                $box[2] + $boxPadding,
                $box[3] + $boxPadding,
            ];
        }

        $box = $this->makeBoxIntegers([
            $box[0], // left
            $box[1], // top
            $box[2] - $box[0], // width
            $box[3] - $box[1], // height
        ]);

        // Ensure minimum dimensions. This is important e.g. with a line string that is
        // exactly parallel to the x or y axis.
        if ($box[2] === 0) {
            $box[0] -= intval($minSize / 2);
            $box[2] = $minSize;
        }

        if ($box[3] === 0) {
            $box[1] -= intval($minSize / 2);
            $box[3] = $minSize;
        }

        return $box;
    }

    /**
     * Modify a bounding box so it adheres to the aspect ratio given by width and height.
     */
    public function ensureBoxAspectRatio(array $box, int $aspectWidth, int $aspectHeight): array
    {
        [$left, $top, $width, $height] = $box;

        // Ensure the minimum width so the annotation patch is not "zoomed in".
        if ($width < $aspectWidth) {
            $left -= ($aspectWidth - $width) / 2.0;
            $width = $aspectWidth;
        }

        // Ensure the minimum height so the annotation patch is not "zoomed in".
        if ($height < $aspectHeight) {
            $top -= ($aspectHeight - $height) / 2.0;
            $height = $aspectHeight;
        }

        $widthRatio = $width / $aspectWidth;
        $heightRatio = $height / $aspectHeight;

        // Increase the size of the patch so its aspect ratio is the same than the
        // ratio of the given dimensions.
        if ($widthRatio > $heightRatio) {
            $newHeight = round($aspectHeight * $widthRatio);
            $top -= round(($newHeight - $height) / 2);
            $height = $newHeight;
        } else {
            $newWidth = round($aspectWidth * $heightRatio);
            $left -= round(($newWidth - $width) / 2);
            $width = $newWidth;
        }

        return $this->makeBoxIntegers([$left, $top, $width, $height]);
    }

    /**
     * Adjust the position and size of the box so it is contained in a box with the given
     * dimensions.
     */
    public function makeBoxContained(array $box, ?int $maxWidth, ?int $maxHeight)
    {
        [$left, $top, $width, $height] = $box;

        if (!is_null($maxWidth)) {
            $left = min($maxWidth - $width, $left);
            // Adjust dimensions of rect if it is larger than the image.
            $width = min($maxWidth, $width);
        }

        if (!is_null($maxHeight)) {
            $top = min($maxHeight - $height, $top);
            // Adjust dimensions of rect if it is larger than the image.
            $height = min($maxHeight, $height);
        }

        // Order of min max is importans so the point gets no negative coordinates.
        $left = max(0, $left);
        $top = max(0, $top);

        return [$left, $top, $width, $height];
    }

    /**
     * Get the bounding box of a point annotation.
     */
    protected function getPointBoundingBox(array $points, int $padding): array
    {
        return [
            $points[0] - $padding,
            $points[1] - $padding,
            $points[0] + $padding,
            $points[1] + $padding,
        ];
    }

    /**
     * Get the bounding box of a circle annotation.
     */
    protected function getCircleBoundingBox(array $points): array
    {
        return [
            $points[0] - $points[2],
            $points[1] - $points[2],
            $points[0] + $points[2],
            $points[1] + $points[2],
        ];
    }

    /**
     * Get the bounding box of an ellipse annotation.
     *
     * The four points of an ellipse are the end points of its two axes (points 1 and 3
     * are the ends of one axis, points 2 and 4 of the other). The bounding box of the
     * points is too small if the ellipse is rotated.
     */
    protected function getEllipseBoundingBox(array $points): array
    {
        if (count($points) !== 8) {
            return $this->getPolygonBoundingBox($points);
        }

        $centerX = array_sum([$points[0], $points[2], $points[4], $points[6]]) / 4;
        $centerY = array_sum([$points[1], $points[3], $points[5], $points[7]]) / 4;
        // Vectors from the center to the end of each axis (half axes).
        $ux = ($points[0] - $points[4]) / 2;
        $uy = ($points[1] - $points[5]) / 2;
        $vx = ($points[2] - $points[6]) / 2;
        $vy = ($points[3] - $points[7]) / 2;
        // Extent of the ellipse c + u * cos(t) + v * sin(t) in x and y direction.
        $halfWidth = sqrt($ux * $ux + $vx * $vx);
        $halfHeight = sqrt($uy * $uy + $vy * $vy);

        return [
            $centerX - $halfWidth,
            $centerY - $halfHeight,
            $centerX + $halfWidth,
            $centerY + $halfHeight,
        ];
    }

    /**
     * Get the bounding box of an annotation that is no point, circle or whole frame.
     */
    protected function getPolygonBoundingBox(array $points): array
    {
        $minX = INF;
        $minY = INF;
        $maxX = -INF;
        $maxY = -INF;

        for ($i = 0; $i < count($points); $i += 2) {
            $minX = min($minX, $points[$i]);
            $minY = min($minY, $points[$i + 1]);
            $maxX = max($maxX, $points[$i]);
            $maxY = max($maxY, $points[$i + 1]);
        }

        return [$minX, $minY, $maxX, $maxY];
    }

    /**
     * Round and cast box values to int.
     */
    protected function makeBoxIntegers(array $box): array
    {
        return array_map(fn ($v) => intval(round($v)), $box);
    }

    protected function generateAnnotationBoxes(VolumeFile $file, Collection $annotations): array
    {
        $boxes = [];
        foreach ($annotations as $a) {
            if ($a->shape === Shape::WHOLE_FRAME) {
                $box = [0, 0, $file->width ?: 0, $file->height ?: 0];
            } else {
                $points = $a->getPoints();
                if (($a instanceof VideoAnnotation) && !empty($points)) {
                    $points = $points[0];
                }
                $box = $this->getAnnotationBoundingBox($points, $a->getShape());
                $box = $this->makeBoxContained($box, $file->width, $file->height);
            }

            if ($box[2] !== 0 && $box[3] !== 0) {
                $boxes[$a->id] = $box;
            }
        }

        return $boxes;
    }

    /**
     * Get the byte string of the cropped and resized patch for the Python worker.
     */
    protected function getCropBufferForPyworker(VipsImage $image, array $box): string
    {
        $factor = static::DINO_PATCH_SIZE / max($box[2], $box[3]);
        $crop = $image->crop(...$box)->resize($factor);

        return $crop->writeToBuffer('.png');
    }

    /**
     * Send the PNG image crop to the Python worker and return the feature vector array.
     */
    protected function sendPyworkerRequest(string $buffer): array
    {
        $url = config('largo.extract_features_worker_url');
        $response = Http::withBody($buffer, 'image/png')->post($url);
        if ($response->successful()) {
            return $response->json();
        } else {
            $pyException = $response->body();
            throw new Exception("Error in pyworker:\n {$pyException}");
        }
    }
}
