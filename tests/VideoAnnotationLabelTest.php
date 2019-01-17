<?php

namespace Biigle\Tests\Modules\Videos;

use ModelTestCase;
use Biigle\Modules\Videos\VideoAnnotationLabel;

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
