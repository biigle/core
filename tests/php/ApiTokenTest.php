<?php

namespace Biigle\Tests;

use Biigle\ApiToken;
use Illuminate\Database\QueryException;
use ModelTestCase;

class ApiTokenTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = ApiToken::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->owner_id);
        $this->assertNotNull($this->model->purpose);
        $this->assertNotNull($this->model->hash);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testOwnerRequired()
    {
        $this->model->owner_id = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testPurposeRequired()
    {
        $this->model->purpose = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testHashRequired()
    {
        $this->model->hash = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testOwnerOnDeleteCascade()
    {
        $this->model->owner()->delete();
        $this->assertNull($this->model->fresh());
    }
}
