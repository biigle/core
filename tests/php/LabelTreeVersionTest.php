<?php

namespace Biigle\Tests;

use ModelTestCase;
use Biigle\LabelTreeVersion;

class LabelTreeVersionTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = LabelTreeVersion::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->description);
        $this->assertNotNull($this->model->labelTree);
    }
}
