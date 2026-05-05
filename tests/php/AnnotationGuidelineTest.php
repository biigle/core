<?php

namespace Biigle\Tests;

use Biigle\AnnotationGuideline;
use Illuminate\Database\QueryException;
use ModelTestCase;

class AnnotationGuidelineTest extends ModelTestCase
{
    protected static $modelClass = AnnotationGuideline::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->project_id);
        $this->assertNull($this->model->description);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
    }

    public function testProjectRequired()
    {
        $this->expectException(QueryException::class);
        self::create(['project_id' => null]);
    }

    public function testProjectUnique()
    {
        $project = ProjectTest::create();
        self::create(['project_id' => $project->id]);
        $this->expectException(QueryException::class);
        self::create(['project_id' => $project->id]);
    }

    public function testProjectOnDeleteCascade()
    {
        $project = ProjectTest::create();
        $guideline = self::create(['project_id' => $project->id]);
        $project->delete();
        $this->assertNull($guideline->fresh());
    }

    public function testProject()
    {
        $project = ProjectTest::create();
        $guideline = self::create(['project_id' => $project->id]);
        $this->assertSame($project->id, $guideline->project->id);
    }

    public function testLabels()
    {
        $label = LabelTest::create();
        $this->model->labels()->attach($label->id);
        $this->assertSame($label->id, $this->model->labels()->first()->id);
    }

    public function testLabelsOnDeleteCascade()
    {
        $label = LabelTest::create();
        $this->model->labels()->attach($label->id);
        $this->model->delete();
        $this->assertFalse($this->model->labels()->exists());
        $this->assertNotNull($label->fresh());
    }
}
