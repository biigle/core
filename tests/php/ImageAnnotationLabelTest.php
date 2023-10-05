<?php

namespace Biigle\Tests;

use Biigle\ImageAnnotationLabel;
use Illuminate\Database\QueryException;
use ModelTestCase;

class ImageAnnotationLabelTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = ImageAnnotationLabel::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->annotation);
        $this->assertNotNull($this->model->label);
        $this->assertNotNull($this->model->user);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertTrue(is_float($this->model->confidence));
    }

    public function testHiddenAttributes()
    {
        // API key mustn't show up in the JSON
        $json = json_decode((string) self::create());
        $this->assertObjectHasProperty('confidence', $json);
    }

    public function testAnnotationOnDeleteCascade()
    {
        $this->assertNotNull(ImageAnnotationLabel::find($this->model->id));
        $this->model->annotation()->delete();
        $this->assertNull(ImageAnnotationLabel::find($this->model->id));
    }

    public function testLabelOnDeleteRestrict()
    {
        $this->assertNotNull(ImageAnnotationLabel::find($this->model->id));
        $this->expectException(QueryException::class);
        $this->model->label()->delete();
    }

    public function testUserOnDeleteSetNull()
    {
        $this->assertNotNull($this->model->fresh()->user);
        $this->model->user->delete();
        $this->assertNull($this->model->fresh()->user);
    }

    public function testUniqueProperties()
    {
        $this->expectException(QueryException::class);
        self::create([
            'annotation_id' => $this->model->annotation_id,
            'label_id' => $this->model->label_id,
            'user_id' => $this->model->user_id,
        ]);
    }
}
