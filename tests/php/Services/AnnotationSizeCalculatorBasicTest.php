<?php

namespace Biigle\Tests\Services;

use Biigle\Services\AnnotationSizeCalculator;
use Biigle\Shape;
use PHPUnit\Framework\TestCase;

class AnnotationSizeCalculatorBasicTest extends TestCase
{
    public function testGetSizeCategories()
    {
        $categories = AnnotationSizeCalculator::getSizeCategories();
        $this->assertIsArray($categories);
        $this->assertCount(6, $categories);
        $this->assertEquals('No area', $categories[0]);
        $this->assertEquals('Very large (> 100k px²)', $categories[5]);
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
}
