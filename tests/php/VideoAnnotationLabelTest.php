<?php

namespace Biigle\Tests;

use ModelTestCase;
use Biigle\VideoAnnotationLabel;

class VideoAnnotationLabelTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = VideoAnnotationLabel::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->annotation);
        $this->assertNotNull($this->model->label);
        $this->assertNotNull($this->model->user);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }
}
