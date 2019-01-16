<?php

namespace Biigle\Tests\Modules\Videos;

use Biigle\Tests\TestCase;
use Biigle\Modules\Videos\VideoAnnotation;

class AnnotationTest extends TestCase
{
    public function testModel()
    {
        $annotation = factory(VideoAnnotation::class)->create();
        $this->assertNotNull($annotation->video);
        $this->assertNotNull($annotation->shape);
        $this->assertNotNull($annotation->created_at);
        $this->assertNotNull($annotation->updated_at);
        $this->assertNotNull($annotation->points);
    }

    public function testCastsPoints()
    {
        $expect = ['t 10.0', 100, 123, 't 15.0'];
        $annotation = factory(VideoAnnotation::class)->create(['points' => $expect]);
        $this->assertEquals($expect, $annotation->points);
    }
}
