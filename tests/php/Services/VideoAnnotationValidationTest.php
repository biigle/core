<?php

namespace Biigle\Tests\Services;

use Biigle\Services\VideoAnnotationValidation;
use TestCase;

class VideoAnnotationValidationTest extends TestCase
{
    public function testCheckPointsValid()
    {
        $this->assertNull(VideoAnnotationValidation::checkPoints([[10, 11], [20.5, 21.5]]));
    }

    public function testCheckPointsEmpty()
    {
        // An empty array is rejected by the 'required' rule of the form requests.
        $this->assertNull(VideoAnnotationValidation::checkPoints([]));
    }

    public function testCheckPointsNoArray()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkPoints('abc'));
    }

    public function testCheckPointsNoArrayOfArrays()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkPoints([10, 11]));
        $this->assertNotNull(VideoAnnotationValidation::checkPoints([null]));
    }

    public function testCheckPointsNoNumbers()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkPoints([['abc']]));
        $this->assertNotNull(VideoAnnotationValidation::checkPoints([[[10, 11]]]));
        $this->assertNotNull(VideoAnnotationValidation::checkPoints([[true]]));
    }

    public function testCheckPointsNumericStrings()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkPoints([['10', '11']]));
    }

    public function testCheckPointsGap()
    {
        // Where a gap is allowed is checked in checkGaps().
        $this->assertNull(VideoAnnotationValidation::checkPoints([[10, 11], [], [20, 21]]));
        $this->assertNull(VideoAnnotationValidation::checkPoints([[]]));
    }

    public function testCheckPointsNoList()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkPoints([1 => [10, 11], 2 => [20, 21]]));
        $this->assertNotNull(VideoAnnotationValidation::checkPoints([0 => [10, 11], 2 => [20, 21]]));
        $this->assertNotNull(VideoAnnotationValidation::checkPoints([[1 => 10, 2 => 11]]));
    }

    public function testCheckFramesValid()
    {
        $this->assertNull(VideoAnnotationValidation::checkFrames([0, 1.5, 10.0], 10.0));
    }

    public function testCheckFramesEmpty()
    {
        // An empty array is rejected by the 'required' rule of the form requests.
        $this->assertNull(VideoAnnotationValidation::checkFrames([], 10.0));
    }

    public function testCheckFramesNoArray()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkFrames('abc', 10.0));
    }

    public function testCheckFramesNoNumber()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkFrames(['abc'], 10.0));
        $this->assertNotNull(VideoAnnotationValidation::checkFrames([[1.0]], 10.0));
        $this->assertNotNull(VideoAnnotationValidation::checkFrames([true], 10.0));
    }

    public function testCheckFramesNumericString()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkFrames(['1.0'], 10.0));
    }

    public function testCheckFramesNegative()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkFrames([-1.0], 10.0));
    }

    public function testCheckFramesExceedsDuration()
    {
        $this->assertNull(VideoAnnotationValidation::checkFrames([10.0], 10.0));
        $this->assertNotNull(VideoAnnotationValidation::checkFrames([10.1], 10.0));
    }

    public function testCheckFramesGap()
    {
        $this->assertNull(VideoAnnotationValidation::checkFrames([1.0, null, 3.0], 10.0));
    }

    public function testCheckFramesGapAtStart()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkFrames([null, 3.0], 10.0));
    }

    public function testCheckFramesGapAtEnd()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkFrames([1.0, null], 10.0));
    }

    public function testCheckFramesOnlyGap()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkFrames([null], 10.0));
    }

    public function testCheckFramesNoList()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkFrames([1 => 1.0, 2 => 2.0], 10.0));
        $this->assertNotNull(VideoAnnotationValidation::checkFrames([0 => 1.0, 2 => 2.0], 10.0));
    }

    public function testCheckGapsValid()
    {
        $this->assertNull(VideoAnnotationValidation::checkGaps([[10, 11], [20, 21]], [1.0, 2.0]));
        $this->assertNull(VideoAnnotationValidation::checkGaps([[10, 11], [], [20, 21]], [1.0, null, 3.0]));
    }

    public function testCheckGapsCountMismatch()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkGaps([[10, 11]], [1.0, 2.0]));
    }

    public function testCheckGapsAtStartOrEnd()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkGaps([[], [20, 21]], [null, 2.0]));
        $this->assertNotNull(VideoAnnotationValidation::checkGaps([[10, 11], []], [1.0, null]));
        $this->assertNotNull(VideoAnnotationValidation::checkGaps([[], []], [null, null]));
    }

    public function testCheckGapsWithoutNullFrame()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkGaps([[10, 11], [], [20, 21]], [1.0, 2.0, 3.0]));
    }

    public function testCheckGapsNullFrameWithoutGap()
    {
        $this->assertNotNull(VideoAnnotationValidation::checkGaps([[10, 11], [15, 16], [20, 21]], [1.0, null, 3.0]));
    }
}
