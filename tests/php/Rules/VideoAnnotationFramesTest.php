<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\VideoAnnotationFrames;
use Illuminate\Support\Facades\Validator;
use TestCase;

class VideoAnnotationFramesTest extends TestCase
{
    private function validate($frames, $duration = null): bool
    {
        $validator = Validator::make(
            ['frames' => $frames],
            ['frames' => new VideoAnnotationFrames($duration)]
        );

        return !$validator->fails();
    }

    public function testNoArray()
    {
        // The type is checked by the separate 'array' rule of the form requests, so
        // this rule accepts anything that is no array.
        $validator = Validator::make(
            ['frames' => 'abc'],
            ['frames' => new VideoAnnotationFrames(10.0)]
        );
        $this->assertFalse($validator->fails());
    }

    public function testValid()
    {
        $this->assertTrue($this->validate([0, 1.5, 10.0], 10.0));
    }

    public function testEmpty()
    {
        // An empty array is rejected by the 'required' rule of the form requests.
        $this->assertTrue($this->validate([], 10.0));
    }

    public function testNoNumber()
    {
        $this->assertFalse($this->validate(['abc'], 10.0));
        $this->assertFalse($this->validate([[1.0]], 10.0));
        $this->assertFalse($this->validate([true], 10.0));
    }

    public function testNumericString()
    {
        $this->assertFalse($this->validate(['1.0'], 10.0));
    }

    public function testNegative()
    {
        $this->assertFalse($this->validate([-1.0], 10.0));
    }

    public function testExceedsDuration()
    {
        $this->assertTrue($this->validate([10.0], 10.0));
        $this->assertFalse($this->validate([10.1], 10.0));
    }

    public function testDurationUnknown()
    {
        // Only the upper bound is skipped if the duration is unknown.
        $this->assertTrue($this->validate([1000.0], null));
        $this->assertFalse($this->validate([-1.0], null));
    }

    public function testDurationUnknownNoNumber()
    {
        $this->assertFalse($this->validate(['abc'], null));
        $this->assertFalse($this->validate(['1.0'], null));
    }

    public function testGap()
    {
        $this->assertTrue($this->validate([1.0, null, 3.0], 10.0));
    }

    public function testGapAtStart()
    {
        $this->assertFalse($this->validate([null, 3.0], 10.0));
    }

    public function testGapAtEnd()
    {
        $this->assertFalse($this->validate([1.0, null], 10.0));
    }

    public function testOnlyGap()
    {
        $this->assertFalse($this->validate([null], 10.0));
    }

    public function testNoList()
    {
        $this->assertFalse($this->validate([1 => 1.0, 2 => 2.0], 10.0));
        $this->assertFalse($this->validate([0 => 1.0, 2 => 2.0], 10.0));
    }
}
