<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndUser;
use Biigle\Services\MetadataParsing\User;
use Biigle\Services\MetadataParsing\VideoAnnotation;
use Biigle\Shape;
use Exception;
use TestCase;

class VideoAnnotationTest extends TestCase
{
    public function testGetInsertData()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10]],
            frames: [1],
            labels: [],
        );

        $expect = [
            'video_id' => 123,
            'points' => '[[10,10]]',
            'shape_id' => Shape::pointId(),
            'frames' => '[1]',
        ];

        $this->assertEquals($expect, $data->getInsertData(123));
    }

    public function testValidateLabels()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10]],
            frames: [1],
            labels: [],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidatePoints()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10, 10]],
            frames: [1],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidatePointsArray1()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            frames: [1],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidatePointsArray2()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[], [10, 10]],
            frames: [1, 2],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidatePointsArray3()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[]],
            frames: [1],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidateFramesArray1()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10]],
            frames: [],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidateFramesArray2()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10]],
            frames: ['a'],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidatePointsArray4()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [10],
            frames: [1],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidatePointsWithGap()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10], [], [20, 20]],
            frames: [1, null, 3],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectNotToPerformAssertions();
        $data->validate();
    }

    public function testValidatePointsGapAtEnd()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10], []],
            frames: [1, null],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidatePointsGapWithoutNullFrame()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10], [], [20, 20]],
            frames: [1, 2, 3],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }

    public function testValidatePointsNullFrameWithoutGap()
    {
        $data = new VideoAnnotation(
            shape: Shape::point(),
            points: [[10, 10], [15, 15], [20, 20]],
            frames: [1, null, 3],
            labels: [new LabelAndUser(new Label(1, 'x'), new User(2, 'y'))],
        );

        $this->expectException(Exception::class);
        $data->validate();
    }
}
