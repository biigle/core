<?php

namespace Biigle\Tests\Services;

use Biigle\Services\AnnotationSizeCalculator;
use Biigle\Shape;
use TestCase;

class AnnotationSizeCalculatorTest extends TestCase
{
    public function testCalculateAreaCircle()
    {
        // Circle with radius 10: area = π * r² = π * 100 ≈ 314.16
        $points = [100, 100, 10]; // center x, center y, radius
        $area = AnnotationSizeCalculator::calculateArea(Shape::circleId(), $points);
        $this->assertEqualsWithDelta(314.159, $area, 0.01);
    }

    public function testCalculateAreaRectangle()
    {
        // Rectangle 10x20 = 200
        $points = [0, 0, 10, 0, 10, 20, 0, 20]; // four corners
        $area = AnnotationSizeCalculator::calculateArea(Shape::rectangleId(), $points);
        $this->assertEquals(200, $area);
    }

    public function testCalculateAreaPolygon()
    {
        // Simple square 10x10 = 100
        $points = [0, 0, 10, 0, 10, 10, 0, 10]; // four corners
        $area = AnnotationSizeCalculator::calculateArea(Shape::polygonId(), $points);
        $this->assertEquals(100, $area);
    }

    public function testCalculateAreaEllipse()
    {
        // Ellipse with major axis 20 and minor axis 20: area = π * a * b / 4 = π * 20 * 20 / 4 ≈ 314.16
        $points = [0, 0, 20, 0, 0, 10, 0, -10]; // endpoints of major and minor axes
        $area = AnnotationSizeCalculator::calculateArea(Shape::ellipseId(), $points);
        $this->assertEqualsWithDelta(314.159, $area, 0.01);
    }

    public function testCalculateAreaPoint()
    {
        $points = [100, 100];
        $area = AnnotationSizeCalculator::calculateArea(Shape::pointId(), $points);
        $this->assertEquals(0, $area);
    }

    public function testCalculateAreaLine()
    {
        $points = [0, 0, 10, 0, 20, 0]; // straight line
        $area = AnnotationSizeCalculator::calculateArea(Shape::lineId(), $points);
        $this->assertEquals(0, $area);
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

    public function testGetSizeCategoryId()
    {
        $this->assertEquals(0, AnnotationSizeCalculator::getSizeCategoryId(0));
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
}
