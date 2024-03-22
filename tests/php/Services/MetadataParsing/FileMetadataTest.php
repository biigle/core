<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndUser;
use Biigle\Services\MetadataParsing\User;
use Biigle\Shape;
use TestCase;

class FileMetadataTest extends TestCase
{
    public function testTrimName()
    {
        $data = new ImageMetadata(' filename');
        $this->assertEquals('filename', $data->name);
    }

    public function testIsEmpty()
    {
        $data = new ImageMetadata('filename');
        $this->assertTrue($data->isEmpty());

        $data = new ImageMetadata('filename', area: 10);
        $this->assertFalse($data->isEmpty());
    }

    public function testHasAnnotations()
    {
        $data = new ImageMetadata('filename');
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );

        $this->assertFalse($data->hasAnnotations());
        $data->addAnnotation($annotation);
        $this->assertTrue($data->hasAnnotations());
    }

    public function testGetFileLabelLabels()
    {
        $data = new ImageMetadata('filename');
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);

        $this->assertEquals([], $data->getFileLabelLabels());
        $data->addFileLabel($lau);
        $this->assertEquals([123 => $label], $data->getFileLabelLabels());

        $label2 = new Label(456, 'my label');
        $lau = new LabelAndUser($label2, $user);
        $this->assertEquals([123 => $label], $data->getFileLabelLabels([123]));
    }

    public function testHasFileLabels()
    {
        $data = new ImageMetadata('filename');
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);

        $this->assertFalse($data->hasFileLabels());
        $data->addFileLabel($lau);
        $this->assertTrue($data->hasFileLabels());
    }

    public function testGetAnnotationLabels()
    {
        $data = new ImageMetadata('filename');
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );

        $this->assertEquals([], $data->getAnnotationLabels());
        $data->addAnnotation($annotation);
        $this->assertEquals([123 => $label], $data->getAnnotationLabels());

        $label2 = new Label(456, 'my label');
        $lau = new LabelAndUser($label2, $user);
        $annotation2 = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $data->addAnnotation($annotation2);
        $this->assertEquals([123 => $label], $data->getAnnotationLabels([123]));
    }

    public function testGetUsers()
    {
        $data = new ImageMetadata('filename');
        $label = new Label(123, 'my label');
        $user1 = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user1);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );

        $this->assertEquals([], $data->getUsers());
        $data->addAnnotation($annotation);
        $this->assertEquals([321 => $user1], $data->getUsers());

        $user2 = new User(432, 'joe user');
        $lau = new LabelAndUser($label, $user2);
        $data->addFileLabel($lau);
        $this->assertEquals([321 => $user1, 432 => $user2], $data->getUsers());
    }

    public function testGetFileLabelUsersOnlyLabels()
    {
        $data = new ImageMetadata('filename');

        $label1 = new Label(123, 'my label');
        $user1 = new User(432, 'joe user');
        $lau = new LabelAndUser($label1, $user1);
        $data->addFileLabel($lau);

        $label2 = new Label(456, 'my label');
        $user2 = new User(654, 'joe user');
        $lau = new LabelAndUser($label2, $user2);
        $data->addFileLabel($lau);

        $this->assertEquals([432 => $user1], $data->getUsers([123]));
    }

    public function testGetAnnotationUsersOnlyLabels()
    {
        $data = new ImageMetadata('filename');

        $label1 = new Label(123, 'my label');
        $user1 = new User(432, 'joe user');
        $lau = new LabelAndUser($label1, $user1);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $data->addAnnotation($annotation);

        $label2 = new Label(456, 'my label');
        $user2 = new User(654, 'joe user');
        $lau = new LabelAndUser($label2, $user2);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $data->addAnnotation($annotation);

        $this->assertEquals([432 => $user1], $data->getUsers([123]));
    }
}
