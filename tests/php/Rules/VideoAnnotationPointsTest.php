<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\VideoAnnotationPoints;
use TestCase;
use Validator;

class VideoAnnotationPointsTest extends TestCase
{
    public function testValid()
    {
        $this->assertTrue($this->passes([[10, 11], [20.5, 21.5]]));
    }

    public function testEmpty()
    {
        // An empty array is rejected by the 'required' rule of the form requests.
        $this->assertTrue($this->passes([]));
    }

    public function testNoArray()
    {
        $this->assertFalse($this->passes('abc'));
    }

    public function testNoArrayOfArrays()
    {
        $this->assertFalse($this->passes([10, 11]));
        $this->assertFalse($this->passes([null]));
    }

    public function testNoNumbers()
    {
        $this->assertFalse($this->passes([['abc']]));
        $this->assertFalse($this->passes([[[10, 11]]]));
        $this->assertFalse($this->passes([[true]]));
    }

    public function testNumericStrings()
    {
        $this->assertFalse($this->passes([['10', '11']]));
    }

    public function testGap()
    {
        // Where a gap is allowed is checked in VideoAnnotation::validatePoints().
        $this->assertTrue($this->passes([[10, 11], [], [20, 21]]));
        $this->assertTrue($this->passes([[]]));
    }

    public function testNoList()
    {
        $this->assertFalse($this->passes([1 => [10, 11], 2 => [20, 21]]));
        $this->assertFalse($this->passes([0 => [10, 11], 2 => [20, 21]]));
        $this->assertFalse($this->passes([[1 => 10, 2 => 11]]));
    }

    protected function passes(mixed $value): bool
    {
        $rules = ['points' => new VideoAnnotationPoints];

        return Validator::make(['points' => $value], $rules)->passes();
    }
}
