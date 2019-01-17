<?php

namespace Biigle\Tests\Modules\Videos;

use Exception;
use Biigle\Shape;
use ModelTestCase;
use Biigle\Tests\LabelTest;
use Biigle\Modules\Videos\VideoAnnotation;

class VideoAnnotationTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = VideoAnnotation::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->video);
        $this->assertNotNull($this->model->shape);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->points);
        $this->assertNotNull($this->model->frames);
    }

    public function testLabels()
    {
        $this->assertFalse($this->model->labels()->exists());
        VideoAnnotationLabelTest::create([
            'video_annotation_id' => $this->model->id,
        ]);
        $this->assertTrue($this->model->labels()->exists());
    }

    public function testRoundPoints()
    {
        $this->model->points = [[1.23456789, 2.23456789, 3.1415]];
        $this->model->save();
        $this->assertEquals([[1.23, 2.23, 3.14]], $this->model->fresh()->points);
    }

    public function testValidatePointsFramesMismatch()
    {
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10]];
        $this->model->frames = [0.0, 1.0];
        $this->model->validatePoints();
    }

    public function testValidatePointsPoint()
    {
        $this->model->shape_id = Shape::pointId();
        $this->model->points = [[10.5, 10.5]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10, 20, 20]];
        $this->model->validatePoints();
    }

    public function testValidatePointsCircle()
    {
        $this->model->shape_id = Shape::circleId();
        $this->model->points = [[10, 10, 20]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10]];
        $this->model->validatePoints();
    }

    public function testValidatePointsRectangle()
    {
        $this->model->shape_id = Shape::rectangleId();
        $this->model->points = [[10, 10, 10, 20, 20, 20, 20, 10]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10]];
        $this->model->validatePoints();
    }

    public function testValidatePointsEllipse()
    {
        $this->model->shape_id = Shape::ellipseId();
        $this->model->points = [[10, 10, 10, 20, 20, 20, 20, 10]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10, 10]];
        $this->model->validatePoints();
    }

    public function testValidatePointsLine()
    {
        $this->model->shape_id = Shape::lineId();
        $this->model->points = [[10, 10]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10]];
        $this->model->validatePoints();
    }

    public function testValidatePointsPolygon()
    {
        $this->model->shape_id = Shape::polygonId();
        $this->model->points = [[10, 10]];
        $this->model->frames = [0.0];
        $this->model->validatePoints();
        $this->expectException(Exception::class);
        $this->model->points = [[10]];
        $this->model->validatePoints();
    }
}
