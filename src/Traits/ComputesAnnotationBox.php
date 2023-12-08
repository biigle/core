<?php

namespace Biigle\Modules\Largo\Traits;

use Biigle\Shape;

trait ComputesAnnotationBox
{
    /**
     * Get the bounding box of an annotation
     */
    public function getAnnotationBoundingBox(
        array $points,
        Shape $shape,
        // This results in the 224x224 expected by ExtractFeatures.py.
        int $pointPadding = 112,
        int $boxPadding = 0
    ): array
    {
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

        return $this->makeBoxIntegers([
            $box[0], // left
            $box[1], // top
            $box[2] - $box[0], // width
            $box[3] - $box[1], // height
        ]);
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
}
