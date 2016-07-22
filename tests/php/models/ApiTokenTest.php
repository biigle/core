<?php

use Dias\ApiToken;

class ApiTokenTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\ApiToken::class;

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
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testPurposeRequired()
    {
        $this->model->purpose = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testHashRequired()
    {
        $this->model->hash = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testOwnerOnDeleteCascade()
    {
        $this->model->owner()->delete();
        $this->assertNull($this->model->fresh());
    }
}
