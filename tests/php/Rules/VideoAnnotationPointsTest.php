<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\VideoAnnotationPoints;
use Biigle\Shape;
use Illuminate\Support\Facades\Validator;
use TestCase;

class VideoAnnotationPointsTest extends TestCase
{
    private function validate($shape, $points): bool
    {
        $shapeId = is_null($shape) ? null : Shape::{$shape.'Id'}();

        $validator = Validator::make(
            ['points' => $points],
            ['points' => new VideoAnnotationPoints($shapeId)]
        );

        return !$validator->fails();
    }

    public function testUnknownShape()
    {
        $this->assertTrue($this->validate(null, [['x']]));
    }

    public function testNoArray()
    {
        // The type is checked by the separate 'array' rule of the form requests, so
        // this rule accepts anything that is no array.
        $validator = Validator::make(
            ['points' => 'abc'],
            ['points' => new VideoAnnotationPoints(Shape::pointId())]
        );
        $this->assertFalse($validator->fails());
    }

    public function testValid()
    {
        $this->assertTrue($this->validate('point', [[10, 11], [20.5, 21.5]]));
    }

    public function testNoArrayOfArrays()
    {
        $this->assertFalse($this->validate('point', [10, 11]));
        $this->assertFalse($this->validate('point', [null]));
    }

    public function testNoNumbers()
    {
        $this->assertFalse($this->validate('point', [['abc']]));
        $this->assertFalse($this->validate('point', [[[10, 11]]]));
        $this->assertFalse($this->validate('point', [[true]]));
    }

    public function testNumericStrings()
    {
        $this->assertFalse($this->validate('point', [['10', '11']]));
    }

    public function testGapAllowedByStructure()
    {
        // Whether a gap is allowed where it appears is checked by VideoAnnotationGaps,
        // not this rule. An empty entry is always a structurally valid gap.
        $this->assertTrue($this->validate('point', [[10, 11], [], [20, 21]]));
    }

    public function testNoList()
    {
        $this->assertFalse($this->validate('point', [1 => [10, 11], 2 => [20, 21]]));
        $this->assertFalse($this->validate('point', [0 => [10, 11], 2 => [20, 21]]));
        $this->assertFalse($this->validate('point', [[1 => 10, 2 => 11]]));
    }

    public function testWholeFrameValid()
    {
        $this->assertTrue($this->validate('wholeFrame', []));
    }

    public function testWholeFrameWithPoints()
    {
        $this->assertFalse($this->validate('wholeFrame', [[0, 0], [1, 1]]));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidShapeCoordinatesProvider')]
    public function testInvalidShapePerKeyFrame($shape, $points)
    {
        // Per-key-frame shape validation is delegated to AnnotationPoints, which has
        // its own exhaustive tests. This only checks that the delegation is wired up.
        $this->assertFalse($this->validate($shape, $points));
    }

    public static function invalidShapeCoordinatesProvider()
    {
        return [
            'point: too many coordinates' => ['point', [[10, 10, 20, 20]]],
            'circle: too few coordinates' => ['circle', [[10, 10]]],
            'rectangle: too few points' => ['rectangle', [[10, 10]]],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('validShapeCoordinatesProvider')]
    public function testValidPoints($shape, $points)
    {
        $this->assertTrue($this->validate($shape, $points));
    }

    public static function validShapeCoordinatesProvider()
    {
        return [
            'point' => ['point', [[10.5, 10.5]]],
            'circle' => ['circle', [[10, 10, 20]]],
            'rectangle' => ['rectangle', [[10, 10, 10, 20, 20, 20, 20, 10]]],
            'ellipse' => ['ellipse', [[10, 10, 10, 20, 20, 20, 20, 10]]],
            'line' => ['line', [[10, 10, 20, 20]]],
            'polygon' => ['polygon', [[10, 10, 20, 20, 30, 30, 10, 10]]],
        ];
    }

    public function testPolygonFirstLastNotEqual()
    {
        $this->assertFalse($this->validate('polygon', [[10, 10, 20, 20, 30, 30, 40, 40]]));
    }

    public function testMultipleKeyFrames()
    {
        $this->assertTrue($this->validate('rectangle', [
            [10, 10, 10, 20, 20, 20, 20, 10],
            [11, 11, 11, 21, 21, 21, 21, 11],
        ]));

        $this->assertFalse($this->validate('rectangle', [
            [10, 10, 10, 20, 20, 20, 20, 10],
            [11, 11],
        ]));
    }
}
