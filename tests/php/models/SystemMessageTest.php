<?php

use Dias\SystemMessage;

class SystemMessageTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\SystemMessage::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->body);
        $this->assertNotNull($this->model->title);
        $this->assertNotNull($this->model->type);
    }

    public function testTitleRequired()
    {
        $this->model->title = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testBodyRequired()
    {
        $this->model->body = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }
}
