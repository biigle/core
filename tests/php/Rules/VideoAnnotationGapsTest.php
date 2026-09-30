<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\VideoAnnotationGaps;
use Illuminate\Support\Facades\Validator;
use TestCase;

class VideoAnnotationGapsTest extends TestCase
{
    private function validate($points, $frames): bool
    {
        $validator = Validator::make(
            ['points' => $points],
            ['points' => new VideoAnnotationGaps($frames)]
        );

        return !$validator->fails();
    }

    public function testNoArray()
    {
        // The type is checked by the separate 'array' rule of the form requests, so
        // this rule accepts anything that is no array.
        $validator = Validator::make(
            ['points' => 'abc'],
            ['points' => new VideoAnnotationGaps([1.0, 2.0])]
        );
        $this->assertFalse($validator->fails());
    }

    public function testValid()
    {
        $this->assertTrue($this->validate([[10, 11], [20, 21]], [1.0, 2.0]));
        $this->assertTrue($this->validate([[10, 11], [], [20, 21]], [1.0, null, 3.0]));
    }

    public function testFramesNoList()
    {
        $this->assertFalse($this->validate([[10, 11], [20, 21]], [1 => 1.0, 2 => 2.0]));
    }

    public function testCountMismatch()
    {
        $this->assertFalse($this->validate([[10, 11]], [1.0, 2.0]));
    }

    public function testAtStartOrEnd()
    {
        $this->assertFalse($this->validate([[], [20, 21]], [null, 2.0]));
        $this->assertFalse($this->validate([[10, 11], []], [1.0, null]));
        $this->assertFalse($this->validate([[], []], [null, null]));
    }

    public function testWithoutNullFrame()
    {
        $this->assertFalse($this->validate([[10, 11], [], [20, 21]], [1.0, 2.0, 3.0]));
    }

    public function testNullFrameWithoutGap()
    {
        $this->assertFalse($this->validate([[10, 11], [15, 16], [20, 21]], [1.0, null, 3.0]));
    }
}
