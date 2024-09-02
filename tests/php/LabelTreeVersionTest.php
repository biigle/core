<?php

namespace Biigle\Tests;

use Biigle\LabelTreeVersion;
use Illuminate\Database\QueryException;
use ModelTestCase;

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
        $this->assertNotNull($this->model->doi);
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

    public function testDoiNullable()
    {
        $this->model->doi = null;
        $this->model->save();
        $this->assertNull($this->model->fresh()->doi);
    }

    public function testNormalizeDoi()
    {
        $this->model->doi = 'https://doi.org/10.5281/zenodo.xxxxxxx';
        $this->assertSame('10.5281/zenodo.xxxxxxx', $this->model->doi);
    }
}
