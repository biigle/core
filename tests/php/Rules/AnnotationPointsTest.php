<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\AnnotationPoints;
use Biigle\Shape;
use Illuminate\Support\Facades\Validator;
use TestCase;

class AnnotationPointsTest extends TestCase
{
    private function validate($shape, $points): bool
    {
        $validator = Validator::make(
            ['points' => $points],
            ['points' => new AnnotationPoints(Shape::{$shape.'Id'}())]
        );

        return !$validator->fails();
    }

    public function testInvalidCoordinateType()
    {
        foreach (['10', 'x', null, [10]] as $invalidCoordinate) {
            $this->assertFalse($this->validate('rectangle', [0, 0, 10, 0, 10, 10, 0, $invalidCoordinate]));
        }
    }

    public function testUnknownShape()
    {
        $validator = Validator::make(
            ['points' => [0, 'x']],
            ['points' => new AnnotationPoints(null)]
        );
        $this->assertFalse($validator->fails());
    }

    public function testNoArray()
    {
        $validator = Validator::make(
            ['points' => 'abc'],
            ['points' => new AnnotationPoints(Shape::pointId())]
        );
        $this->assertFalse($validator->fails());
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidCoordinatesProvider')]
    public function testInvalidNumberOfCoordinates($shape, $points)
    {
        $this->assertFalse($this->validate($shape, $points));
    }

    public static function invalidCoordinatesProvider()
    {
        return [
            'circle: too few coordinates' => ['circle', [0, 0]],
            'circle: too many coordinates' => ['circle', [0, 0, 1, 1]],
            'circle: no coordinates' => ['circle', []],
            'uneven number of coordinates' => ['point', [0]],
            'no coordinates' => ['point', []],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidPointsProvider')]
    public function testInvalidNumberOfPoints($shape, $points)
    {
        $this->assertFalse($this->validate($shape, $points));
    }

    public static function invalidPointsProvider()
    {
        return [
            'point' => ['point', [0, 0, 1, 1]],
            'rectangle' => ['rectangle', [0, 0, 1, 1, 2, 2]],
            'ellipse' => ['ellipse', [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]],
            'polygon' => ['polygon', [0, 0, 1, 1, 0, 0]],
            'line' => ['line', [0, 0]],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidShapesProvider')]
    public function testInvalidShape($shape, $points)
    {
        $this->assertFalse($this->validate($shape, $points));
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
            'line: identical points' => ['line', [0, 0, 0, 0]],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('validPointsProvider')]
    public function testValidPoints($shape, $points)
    {
        $this->assertTrue($this->validate($shape, $points));
    }

    public static function validPointsProvider()
    {
        return [
            'point' => ['point', [0, 0]],
            'point: floats' => ['point', [10.5, 10.5]],
            'circle' => ['circle', [0, 0, 1]],
            'rectangle' => ['rectangle', [0, 0, 1, 0, 1, 1, 0, 1]],
            'ellipse' => ['ellipse', [0, 0, 1, 0, 1, 1, 0, 1]],
            'polygon' => ['polygon', [0, 0, 1, 0, 0, 1, 1, 0, 0, 0]],
            'line' => ['line', [0, 0, 1, 1]],
        ];
    }
}
