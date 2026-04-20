<?php

namespace Biigle\Tests;

use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Shape;
use Biigle\Traits\InvalidCoordinateTypeException;
use Biigle\Traits\InvalidNumberOfCoordinatesException;
use Biigle\Traits\InvalidNumberOfPointsException;
use Biigle\Traits\InvalidShapeException;
use TestCase;

class PointsValidationTest extends TestCase
{
    private function createAndValidateAnnotation($shape, $points)
    {
        $annotation = new ImageAnnotation(Shape::{$shape}(), $points, []);
        $annotation->validatePoints($points);
    }
    
    public function testInvalidCoordinateType()
    {
        $this->expectException(InvalidCoordinateTypeException::class);
        $this->createAndValidateAnnotation('rectangle', [0, 0, 10, 0, 10, 10, 0, '10']);
    }
    
    /**
     * @dataProvider invalidCoordinatesProvider
     */
    public function testInvalidNumberOfCoordinates($shape, $points)
    {
        $this->expectException(InvalidNumberOfCoordinatesException::class);
        $this->createAndValidateAnnotation($shape, $points);
    }
    
    public static function invalidCoordinatesProvider()
    {
        return [
            'circle: too few coordinates' => ['circle', [0, 0]],
            'circle: too many coordinates' => ['circle', [0, 0, 1, 1]],
            'uneven number of coordinates' => ['point', [0]],
            'no coordinates' => ['point', []]
        ];
    }
    
    /**
     * @dataProvider invalidPointsProvider
     */
    public function testInvalidPoints($shape, $points)
    {
        $this->expectException(InvalidNumberOfPointsException::class);
        $this->createAndValidateAnnotation($shape, $points);
    }
    
    public static function invalidPointsProvider()
    {
        return [
            'point' => ['point', [0, 0, 1, 1]],
            'rectangle' => ['rectangle', [0, 0, 1, 1, 2, 2]],
            'ellipse' => ['ellipse', [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]],
            'polygon' => ['polygon', [0, 0, 1, 1, 0, 0]],
            'line' => ['line', [0, 0]]
        ];
    }
    
    /**
     * @dataProvider invalidShapesProvider
     */
    public function testInvalidShape($shape, $points)
    {
        $this->expectException(InvalidShapeException::class);
        $this->createAndValidateAnnotation($shape, $points);
    }
    
    public static function invalidShapesProvider()
    {
        return [
            'circle: radius is 0' => ['circle', [0, 0, 0]],
            'circle: radius is negative' => ['circle', [0, 0, -1]],
            'rectangle: identical points' => ['rectangle', [0, 0, 1, 1, 1, 1, 2, 2]],
            'ellipse: identical points' => ['ellipse', [0, 0, 1, 1, 1, 1, 2, 2]],
            'polygon: identical points' => ['polygon', [0, 0, 1, 1, 1, 1, 0, 0]],
            'polygon: start and end not identical' => ['polygon', [0, 0, 1, 1, 2, 2, 3, 3]],
            'line: identical points' => ['line', [0, 0, 0, 0]]
        ];
    }
    
    /**
     * @dataProvider validPointsProvider
     */
    public function testValidPoints($shape, $points)
    {
        $this->createAndValidateAnnotation($shape, $points);
        $this->assertTrue(true);
    }
    
    public static function validPointsProvider()
    {
        return [
            'point' => ['point', [0, 0]],
            'circle' => ['circle', [0, 0, 1]],
            'rectangle' => ['rectangle', [0, 0, 1, 0, 1, 1, 0, 1]],
            'ellipse' => ['ellipse', [0, 0, 1, 0, 1, 1, 0, 1]],
            'polygon' => ['polygon', [0, 0, 1, 0, 0, 1, 1, 0, 0, 0]],
            'line' => ['line', [0, 0, 1, 1]]
        ];
    }
}
