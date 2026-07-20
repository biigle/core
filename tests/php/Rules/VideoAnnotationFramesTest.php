<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\VideoAnnotationFrames;
use TestCase;
use Validator;

class VideoAnnotationFramesTest extends TestCase
{
    public function testValid()
    {
        $this->assertTrue($this->passes([0, 1.5, 10.0]));
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

    public function testNoNumber()
    {
        $this->assertFalse($this->passes(['abc']));
        $this->assertFalse($this->passes([[1.0]]));
        $this->assertFalse($this->passes([true]));
    }

    public function testNumericString()
    {
        $this->assertFalse($this->passes(['1.0']));
    }

    public function testNegative()
    {
        $this->assertFalse($this->passes([-1.0]));
    }

    public function testExceedsDuration()
    {
        $this->assertTrue($this->passes([10.0]));
        $this->assertFalse($this->passes([10.1]));
    }

    public function testGap()
    {
        $this->assertTrue($this->passes([1.0, null, 3.0]));
    }

    public function testGapAtStart()
    {
        $this->assertFalse($this->passes([null, 3.0]));
    }

    public function testGapAtEnd()
    {
        $this->assertFalse($this->passes([1.0, null]));
    }

    public function testOnlyGap()
    {
        $this->assertFalse($this->passes([null]));
    }

    protected function passes(mixed $value): bool
    {
        $rules = ['frames' => new VideoAnnotationFrames(10.0)];

        return Validator::make(['frames' => $value], $rules)->passes();
    }
}
