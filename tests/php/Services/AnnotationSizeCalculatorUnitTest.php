<?php

namespace Biigle\Tests\Services;

use Biigle\Services\AnnotationSizeCalculator;
use PHPUnit\Framework\TestCase;

class AnnotationSizeCalculatorUnitTest extends TestCase
{
    public function testGetSizeCategory()
    {
        $this->assertEquals('No area', AnnotationSizeCalculator::getSizeCategory(0));
        $this->assertEquals('No area', AnnotationSizeCalculator::getSizeCategory(0.0));
        $this->assertEquals('Very small (< 100 px²)', AnnotationSizeCalculator::getSizeCategory(50));
        $this->assertEquals('Small (100-1000 px²)', AnnotationSizeCalculator::getSizeCategory(500));
        $this->assertEquals('Medium (1k-10k px²)', AnnotationSizeCalculator::getSizeCategory(5000));
        $this->assertEquals('Large (10k-100k px²)', AnnotationSizeCalculator::getSizeCategory(50000));
        $this->assertEquals('Very large (> 100k px²)', AnnotationSizeCalculator::getSizeCategory(500000));
    }

    public function testGetSizeCategoryId()
    {
        $this->assertEquals(0, AnnotationSizeCalculator::getSizeCategoryId(0));
        $this->assertEquals(0, AnnotationSizeCalculator::getSizeCategoryId(0.0));
        $this->assertEquals(1, AnnotationSizeCalculator::getSizeCategoryId(50));
        $this->assertEquals(2, AnnotationSizeCalculator::getSizeCategoryId(500));
        $this->assertEquals(3, AnnotationSizeCalculator::getSizeCategoryId(5000));
        $this->assertEquals(4, AnnotationSizeCalculator::getSizeCategoryId(50000));
        $this->assertEquals(5, AnnotationSizeCalculator::getSizeCategoryId(500000));
    }

    public function testGetSizeCategories()
    {
        $categories = AnnotationSizeCalculator::getSizeCategories();
        $this->assertIsArray($categories);
        $this->assertCount(6, $categories);
        $this->assertEquals('No area', $categories[0]);
        $this->assertEquals('Very large (> 100k px²)', $categories[5]);
    }

    public function testCalculateAreaBasicMath()
    {
        // Test calculations using hardcoded shape IDs to avoid import issues
        // These are the actual shape IDs from the database:
        // 1 = point, 2 = line, 3 = polygon, 4 = circle, 5 = rectangle, 6 = ellipse
        
        // Circle with radius 5: area = π * r² = π * 25 ≈ 78.54
        $circlePoints = [100, 100, 5]; // center x, center y, radius
        $circleArea = AnnotationSizeCalculator::calculateArea(4, $circlePoints); // 4 is circle ID
        $this->assertEqualsWithDelta(78.54, $circleArea, 0.01);
        
        // Test that points and lines return 0 area
        $pointArea = AnnotationSizeCalculator::calculateArea(1, [100, 100]); // 1 is point ID
        $this->assertEquals(0, $pointArea);
        
        $lineArea = AnnotationSizeCalculator::calculateArea(2, [0, 0, 10, 0, 20, 0]); // 2 is line ID
        $this->assertEquals(0, $lineArea);
        
        // Simple rectangle: 10x20 = 200
        $rectanglePoints = [0, 0, 10, 0, 10, 20, 0, 20]; // four corners
        $rectangleArea = AnnotationSizeCalculator::calculateArea(5, $rectanglePoints); // 5 is rectangle ID
        $this->assertEquals(200, $rectangleArea);
    }
}
