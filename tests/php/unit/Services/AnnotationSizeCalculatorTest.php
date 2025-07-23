<?php

namespace Biigle\Tests\Services;

use Biigle\Services\AnnotationSizeCalculator;
use PHPUnit\Framework\TestCase;

class AnnotationSizeCalculatorTest extends TestCase
{
    public function testCalculateAreaPoint()
    {
        $area = AnnotationSizeCalculator::calculateArea(
            AnnotationSizeCalculator::POINT_SHAPE_ID,
            [100, 200]
        );
        $this->assertEquals(0, $area);
    }

    public function testCalculateAreaLine()
    {
        $area = AnnotationSizeCalculator::calculateArea(
            AnnotationSizeCalculator::LINE_SHAPE_ID,
            [0, 0, 10, 10]
        );
        $this->assertEquals(0, $area);
    }

    public function testCalculateAreaCircle()
    {
        // Circle with radius 5
        $area = AnnotationSizeCalculator::calculateArea(
            AnnotationSizeCalculator::CIRCLE_SHAPE_ID,
            [0, 0, 5]
        );
        $this->assertEqualsWithDelta(78.54, $area, 0.01);
    }

    public function testCalculateAreaRectangle()
    {
        // Rectangle 10x5
        $area = AnnotationSizeCalculator::calculateArea(
            AnnotationSizeCalculator::RECTANGLE_SHAPE_ID,
            [0, 0, 10, 0, 10, 5, 0, 5]
        );
        $this->assertEquals(50, $area);
    }

    public function testCalculateAreaPolygon()
    {
        // Triangle with vertices at (0,0), (10,0), (5,10)
        $area = AnnotationSizeCalculator::calculateArea(
            AnnotationSizeCalculator::POLYGON_SHAPE_ID,
            [0, 0, 10, 0, 5, 10]
        );
        $this->assertEquals(50, $area);
    }

    public function testCalculateAreaEllipse()
    {
        // Ellipse with major axis 20 and minor axis 10
        $area = AnnotationSizeCalculator::calculateArea(
            AnnotationSizeCalculator::ELLIPSE_SHAPE_ID,
            [0, 0, 20, 0, 10, 5, 10, -5]
        );
        $this->assertEqualsWithDelta(157.08, $area, 0.01);
    }

    public function testGetSizeCategoryId()
    {
        $this->assertEquals(0, AnnotationSizeCalculator::getSizeCategoryId(0));
        $this->assertEquals(1, AnnotationSizeCalculator::getSizeCategoryId(50));
        $this->assertEquals(2, AnnotationSizeCalculator::getSizeCategoryId(500));
        $this->assertEquals(3, AnnotationSizeCalculator::getSizeCategoryId(5000));
        $this->assertEquals(4, AnnotationSizeCalculator::getSizeCategoryId(50000));
        $this->assertEquals(5, AnnotationSizeCalculator::getSizeCategoryId(500000));
    }

    public function testGetSizeCategory()
    {
        $this->assertEquals('No area', AnnotationSizeCalculator::getSizeCategory(0));
        $this->assertEquals('Very small (< 100 px²)', AnnotationSizeCalculator::getSizeCategory(50));
        $this->assertEquals('Small (100-1000 px²)', AnnotationSizeCalculator::getSizeCategory(500));
        $this->assertEquals('Medium (1k-10k px²)', AnnotationSizeCalculator::getSizeCategory(5000));
        $this->assertEquals('Large (10k-100k px²)', AnnotationSizeCalculator::getSizeCategory(50000));
        $this->assertEquals('Very large (> 100k px²)', AnnotationSizeCalculator::getSizeCategory(500000));
    }

    public function testGetSizeCategories()
    {
        $categories = AnnotationSizeCalculator::getSizeCategories();
        
        $this->assertIsArray($categories);
        $this->assertCount(6, $categories);
        $this->assertArrayHasKey(0, $categories);
        $this->assertArrayHasKey(5, $categories);
        $this->assertEquals('No area', $categories[0]);
        $this->assertEquals('Very large (> 100k px²)', $categories[5]);
    }

    public function testFloatingPointPrecision()
    {
        // Test very small area that might have floating point precision issues
        $this->assertEquals(0, AnnotationSizeCalculator::getSizeCategoryId(0.0001));
        $this->assertEquals('No area', AnnotationSizeCalculator::getSizeCategory(0.0001));
    }

    public function testBoundaryValues()
    {
        // Test exact boundary values
        $this->assertEquals(1, AnnotationSizeCalculator::getSizeCategoryId(99.9));
        $this->assertEquals(2, AnnotationSizeCalculator::getSizeCategoryId(100));
        $this->assertEquals(2, AnnotationSizeCalculator::getSizeCategoryId(999.9));
        $this->assertEquals(3, AnnotationSizeCalculator::getSizeCategoryId(1000));
    }
}
