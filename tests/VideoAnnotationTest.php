<?php

namespace Biigle\Tests\Modules\Videos;

use ModelTestCase;
use Biigle\Modules\Videos\VideoAnnotation;

class AnnotationTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = VideoAnnotation::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->video);
        $this->assertNotNull($this->model->shape);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->points);
        $this->assertNotNull($this->model->frames);
    }
}
