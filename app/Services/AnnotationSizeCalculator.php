<?php

namespace Biigle\Services;

use Biigle\Shape;

class AnnotationSizeCalculator
{
    /**
     * Calculate the area of an annotation in square pixels.
     *
     * @param int $shapeId The shape ID
     * @param array $points The annotation points array
     * @return float The area in square pixels, or 0 for unsupported shapes
     */
    public static function calculateArea(int $shapeId, array $points): float
    {
        switch ($shapeId) {
            case Shape::circleId():
                // For circles, points[2] is the radius
                return pow($points[2], 2) * M_PI;

            case Shape::rectangleId():
                // A --- B
                // |     |
                // D --- C
                // Distance between A and B.
                $dim1 = sqrt(pow($points[0] - $points[2], 2) + pow($points[1] - $points[3], 2));
                // Distance between B and C.
                $dim2 = sqrt(pow($points[2] - $points[4], 2) + pow($points[3] - $points[5], 2));
                return $dim1 * $dim2;

            case Shape::polygonId():
                // Shoelace formula for polygon area
                $area = 0;
                $count = count($points);
                $j = $count - 2; // The last vertex is the 'previous' one to the first

                for ($i = 0; $i < $count; $i += 2) {
                    $area += ($points[$j] + $points[$i]) * ($points[$j + 1] - $points[$i + 1]);
                    $j = $i; // $j is the previous vertex to $i
                }

                return abs($area / 2);

            case Shape::ellipseId():
                // Distance between A and B (major axis).
                $a = sqrt(pow($points[0] - $points[2], 2) + pow($points[1] - $points[3], 2));
                // Distance between C and D (minor axis).
                $b = sqrt(pow($points[4] - $points[6], 2) + pow($points[5] - $points[7], 2));
                // Divide by 4 because $a and $b each are double the lengths.
                return M_PI * $a * $b / 4;

            case Shape::lineId():
                // Lines have no area
                return 0;

            case Shape::pointId():
                // Points have no area
                return 0;

            default:
                return 0;
        }
    }

    /**
     * Get the size category for an annotation based on its area.
     *
     * @param float $area The area in square pixels
     * @return string The size category
     */
    public static function getSizeCategory(float $area): string
    {
        if ($area < 0.001) { // Handle floating point precision issues
            return 'No area';
        } elseif ($area < 100) {
            return 'Very small (< 100 px²)';
        } elseif ($area < 1000) {
            return 'Small (100-1000 px²)';
        } elseif ($area < 10000) {
            return 'Medium (1k-10k px²)';
        } elseif ($area < 100000) {
            return 'Large (10k-100k px²)';
        } else {
            return 'Very large (> 100k px²)';
        }
    }

    /**
     * Get size category ID for filtering.
     *
     * @param float $area The area in square pixels
     * @return int The size category ID
     */
    public static function getSizeCategoryId(float $area): int
    {
        if ($area < 0.001) { // Handle floating point precision issues
            return 0; // No area
        } elseif ($area < 100) {
            return 1; // Very small
        } elseif ($area < 1000) {
            return 2; // Small
        } elseif ($area < 10000) {
            return 3; // Medium
        } elseif ($area < 100000) {
            return 4; // Large
        } else {
            return 5; // Very large
        }
    }

    /**
     * Get all available size categories.
     *
     * @return array Array of size categories [id => name]
     */
    public static function getSizeCategories(): array
    {
        return [
            0 => 'No area',
            1 => 'Very small (< 100 px²)',
            2 => 'Small (100-1000 px²)',
            3 => 'Medium (1k-10k px²)',
            4 => 'Large (10k-100k px²)',
            5 => 'Very large (> 100k px²)',
        ];
    }
}
