<?php

namespace Biigle\Tests;

use TestCase;
use Biigle\Shape;
use Biigle\Services\MetadataParsing\ImageAnnotation;

class PointsValidationTest extends TestCase 
{
    public function testTooFewPointsForShape()
    {
        $shape = Shape::rectangle()->firstOrFail();
        $points = [0,0, 10,0, 10,10, 0,10, 5,5];
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessageMatches('/Too many points for shape/');
        
        (new ImageAnnotation($shape, $points, []))->validatePoints($points);
    }
}