<?php

use Dias\AnnotationSession;

class AnnotationSessionTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\AnnotationSession::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->description);
        $this->assertNotNull($this->model->starts_at);
        $this->assertNotNull($this->model->ends_at);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->transect_id);
        $this->assertNotNull($this->model->hide_other_users_annotations);
        $this->assertNotNull($this->model->hide_own_annotations);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testStartsAtRequired()
    {
        $this->model->starts_at = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testEndsAtRequired()
    {
        $this->model->ends_at = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testTransectOnDeleteCascade()
    {
        $this->model->transect()->delete();
        $this->assertNull($this->model->fresh());
    }
}
