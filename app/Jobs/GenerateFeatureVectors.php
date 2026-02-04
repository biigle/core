<?php

namespace Biigle\Jobs;

use Biigle\Shape;
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
        $box = match ($shape->id) {
            Shape::pointId() => $this->getPointBoundingBox($points, $pointPadding),
            Shape::circleId() => $this->getCircleBoundingBox($points),
            // An ellipse will not be handled correctly by this but I didn't bother
            // because this shape is almost never used anyway.
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
            if ($a->shape_id === Shape::wholeFrameId()) {
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
     * Get the byte string of the cropped and resizd patch for the Python worker.
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
