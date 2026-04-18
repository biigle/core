<?php

namespace Biigle\Tests;

use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Shape;
use Exception;
use TestCase;

class PointsValidationTest extends TestCase
{
    /**
     * @dataProvider validPointsProvider
     */
    public function testValidatePointsAcceptsValidPoints(
        string $shapeMethod,
        array $points
    ) {
        $shape = Shape::{$shapeMethod}();

        $annotation = new ImageAnnotation($shape, $points, []);
        $annotation->validatePoints($points);
        $this->addToAssertionCount(1);
    }
    
    public static function validPointsProvider(): array
    {
        return [
            'point valid points' => [
                'point',
                [0, 0],
            ],
            'circle valid points' => [
                'circle',
                [0, 0, 1],
            ],
            'ellipse valid points' => [
                'ellipse',
                [0, 0, 1, 0, 1, 1, 0, 1],
            ],
            'rectangle valid points' => [
                'rectangle',
                [0, 0, 1, 0, 1, 1, 0, 1],
            ],
            'polygon valid points' => [
                'polygon',
                [0, 0, 1, 0, 1, 1, 0, 0],
            ],
            'line valid points' => [
                'line',
                [0, 0, 1, 1],
            ],
            'whole frame valid points' => [
                'wholeFrame',
                [0, 0],
            ],
        ];
    }

    /**
     * @dataProvider invalidPointsProvider
     */
    public function testValidatePointsReturnsExpectedErrors(
        string $shapeMethod,
        array $points,
        string $expectedMessage
    ) {
        $shape = Shape::{$shapeMethod}();

        $this->expectException(Exception::class);
        $this->expectExceptionMessage($expectedMessage);

        $annotation = new ImageAnnotation($shape, $points, []);
        $annotation->validatePoints($points);
    }

    public static function invalidPointsProvider(): array
    {
        $shapeCases = [
            'point' => [
                'shapeMethod' => 'point',
                'shapeName' => 'Point',
                'tooFew' => [0],
                'tooMany' => [0, 0, 1, 1],
                'invalid' => [0, 'x'],
            ],
            'circle' => [
                'shapeMethod' => 'circle',
                'shapeName' => 'Circle',
                'tooFew' => [0, 0],
                'tooMany' => [0, 0, 1, 2],
                'invalid' => [0, 0, 'x'],
            ],
            'ellipse' => [
                'shapeMethod' => 'ellipse',
                'shapeName' => 'Ellipse',
                'tooFew' => [0, 0, 1, 0, 1, 1],
                'tooMany' => [0, 0, 1, 0, 1, 1, 0, 1, 2, 2],
                'invalid' => [0, 0, 1, 0, 1, 1, 0, 'x'],
            ],
            'rectangle' => [
                'shapeMethod' => 'rectangle',
                'shapeName' => 'Rectangle',
                'tooFew' => [0, 0, 1, 0, 1, 1],
                'tooMany' => [0, 0, 1, 0, 1, 1, 0, 1, 2, 2],
                'invalid' => [0, 0, 1, 0, 1, 1, 0, 'x'],
            ],
            'polygon' => [
                'shapeMethod' => 'polygon',
                'shapeName' => 'Polygon',
                'tooFew' => [0, 0, 1, 0, 1, 1],
                'tooMany' => [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 5],
                'invalid' => [0, 0, 1, 0, 1, 1, 0, 'x', 0, 0],
            ],
            'line' => [
                'shapeMethod' => 'line',
                'shapeName' => 'LineString',
                'tooFew' => [0, 0],
                'tooMany' => [0, 0, 1, 0, 2],
                'invalid' => [0, 0, 1, 'x'],
            ],
            'whole frame' => [
                'shapeMethod' => 'wholeFrame',
                'shapeName' => 'WholeFrame',
                'tooFew' => [],
                'tooMany' => [0, 0, 1],
                'invalid' => [0, 'x'],
            ],
        ];

        $cases = [];

        foreach ($shapeCases as $label => $shapeCase) {
            $shapeMethod = $shapeCase['shapeMethod'];
            $shapeName = $shapeCase['shapeName'];

            $cases[$label.': too few points'] = [
                $shapeMethod,
                $shapeCase['tooFew'],
                'Too few points for shape '.$shapeName.'!',
            ];

            $cases[$label.': too many points'] = [
                $shapeMethod,
                $shapeCase['tooMany'],
                'Too many points for shape '.$shapeName.'!',
            ];

            $cases[$label.': invalid points'] = [
                $shapeMethod,
                $shapeCase['invalid'],
                'Invalid points for shape '.$shapeName.'!',
            ];
        }

        return $cases;
    }
}
