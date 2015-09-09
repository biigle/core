<?php

use Dias\AnnotationPoint;

class AnnotationPointTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\AnnotationPoint::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->annotation);
        $this->assertNotNull($this->model->index);
        $this->assertNotNull($this->model->x);
        $this->assertNotNull($this->model->y);
        $this->assertNull($this->model->created_at);
        $this->assertNull($this->model->updated_at);
    }

    public function testAnnotationRequired()
    {
        $this->model->annotation()->dissociate();
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testIndexRequired()
    {
        $this->model->index = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testXRequired()
    {
        $this->model->x = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testYRequired()
    {
        $this->model->y = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testAnnotationOnDeleteCascade()
    {
        $this->assertNotNull($this->model->fresh());
        $this->model->annotation->delete();
        $this->assertNull($this->model->fresh());
    }

    public function testAnnotationIndexUnique()
    {
        $this->setExpectedException('Illuminate\Database\QueryException');
        self::create([
            'annotation_id' => $this->model->annotation_id,
            'index' => $this->model->index,
        ]);
    }

    public function testProjectIds()
    {
        $annotation = AnnotationTest::create();
        $this->model = $annotation->addPoint(10, 10);
        $project = ProjectTest::create();
        $transect = $annotation->image->transect;
        $this->assertEmpty($this->model->projectIds());
        $project->addTransectId($transect->id);
        // clear caching of previous call
        Cache::flush();
        $ids = $this->model->projectIds();
        $this->assertNotEmpty($ids);
        $this->assertEquals($project->id, $ids[0]);
    }
}
