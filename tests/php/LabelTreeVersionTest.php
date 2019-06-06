<?php

namespace Biigle\Tests;

use ModelTestCase;
use Biigle\LabelTreeVersion;
use Illuminate\Database\QueryException;

class LabelTreeVersionTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = LabelTreeVersion::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->labelTree);
    }

    public function testVesionIdUnique()
    {
        LabelTreeTest::create(['version_id' => $this->model->id]);
        $this->expectException(QueryException::class);
        LabelTreeTest::create(['version_id' => $this->model->id]);
    }

    public function testNameUnique()
    {
        $this->expectException(QueryException::class);
        static::create([
            'name' => $this->model->name,
            'label_tree_id' => $this->model->label_tree_id,
        ]);
    }
}
