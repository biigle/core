<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\Label as DbLabel;
use Biigle\MediaType;
use Biigle\Services\MetadataParsing\FileMetadata;
use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndUser;
use Biigle\Services\MetadataParsing\User;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Biigle\Shape;
use Biigle\User as DbUser;
use TestCase;

class VolumeMetadataTest extends TestCase
{
    public function testNew()
    {
        $metadata = new VolumeMetadata(MediaType::image(), 'volumename', 'volumeurl', 'volumehandle');

        $this->assertEquals(MediaType::imageId(), $metadata->type->id);
        $this->assertEquals('volumename', $metadata->name);
        $this->assertEquals('volumeurl', $metadata->url);
        $this->assertEquals('volumehandle', $metadata->handle);
    }

    public function testAddGetFiles()
    {
        $metadata = new VolumeMetadata;
        $file = new FileMetadata('filename');
        $metadata->addFile($file);
        $this->assertEquals($file, $metadata->getFiles()[0]);
        $metadata->addFile($file);
        $this->assertCount(1, $metadata->getFiles());
    }

    public function testGetFile()
    {
        $metadata = new VolumeMetadata;
        $this->assertNull($metadata->getFile('filename'));
        $file = new FileMetadata('filename');
        $metadata->addFile($file);
        $this->assertEquals($file, $metadata->getFile('filename'));
    }

    public function testIsEmpty()
    {
        $metadata = new VolumeMetadata;
        $this->assertTrue($metadata->isEmpty());
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $this->assertTrue($metadata->isEmpty());
        $file = new ImageMetadata('filename', area: 100);
        $metadata->addFile($file);
        $this->assertFalse($metadata->isEmpty());
    }

    public function testHasAnnotations()
    {
        $metadata = new VolumeMetadata;
        $this->assertFalse($metadata->hasAnnotations());
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $this->assertFalse($metadata->hasAnnotations());

        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$la],
        );
        $file->addAnnotation($annotation);
        $this->assertTrue($metadata->hasAnnotations());
    }

    public function testHasFileLabels()
    {
        $metadata = new VolumeMetadata;
        $this->assertFalse($metadata->hasFileLabels());
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $this->assertFalse($metadata->hasFileLabels());

        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);
        $this->assertTrue($metadata->hasFileLabels());
    }

    public function testGetAnnotationLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $this->assertEquals([], $metadata->getAnnotationLabels());

        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$la],
        );
        $file->addAnnotation($annotation);
        $this->assertEquals([123 => $label], $metadata->getAnnotationLabels());
    }

    public function testGetAnnotationLabelsOnlyLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);

        $label1 = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label1, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$la],
        );
        $file->addAnnotation($annotation);

        $label2 = new Label(456, 'my label');
        $la = new LabelAndUser($label2, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$la],
        );
        $file->addAnnotation($annotation);

        $this->assertEquals([123 => $label1], $metadata->getAnnotationLabels([123]));
    }

    public function testGetFileLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $this->assertEquals([], $metadata->getFileLabels());

        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);
        $this->assertEquals([123 => $label], $metadata->getFileLabels());
    }

    public function testGetFileLabelsOnlyLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);

        $label1 = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label1, $user);
        $file->addFileLabel($la);

        $label2 = new Label(456, 'my label');
        $la = new LabelAndUser($label2, $user);
        $file->addFileLabel($la);

        $this->assertEquals([123 => $label1], $metadata->getFileLabels([123]));
    }

    public function testGetUsers()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $this->assertEquals([], $metadata->getUsers());

        $label = new Label(123, 'my label');
        $user1 = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user1);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);
        $this->assertEquals([321 => $user1], $metadata->getUsers());

        $user2 = new User(432, 'joe user');
        $lau = new LabelAndUser($label, $user2);
        $file->addFileLabel($lau);
        $this->assertEquals([321 => $user1, 432 => $user2], $metadata->getUsers());
    }

    public function testGetUsersOnlyLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label1 = new Label(123, 'my label');
        $user1 = new User(321, 'joe user');
        $lau = new LabelAndUser($label1, $user1);
        $file->addFileLabel($lau);
        $label2 = new Label(456, 'my label');
        $user2 = new User(654, 'joe user');
        $lau = new LabelAndUser($label2, $user2);
        $file->addFileLabel($lau);

        $this->assertEquals([321 => $user1], $metadata->getUsers([123]));
    }

    public function testGetMatchingUsersByMap()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);

        $dbUser = DbUser::factory()->create();
        $matches = $metadata->getMatchingUsers([321 => $dbUser->id]);
        $this->assertEquals([321 => $dbUser->id], $matches);
    }

    public function testGetMatchingUsersByUuid()
    {
        $dbUser = DbUser::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user', uuid: $dbUser->uuid);
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);

        $matches = $metadata->getMatchingUsers();
        $this->assertEquals([321 => $dbUser->id], $matches);
    }

    public function testGetMatchingUsersNoMatch()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user', uuid: "398f42c6-0f24-38de-a1c6-3c467fcb4250");
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);

        $matches = $metadata->getMatchingUsers([321 => -1]);
        $this->assertEquals([321 => null], $matches);
    }

    public function testGetMatchingUsersOnlyLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label1 = new Label(123, 'my label');
        $user1 = new User(321, 'joe user');
        $la = new LabelAndUser($label1, $user1);
        $file->addFileLabel($la);
        $label2 = new Label(456, 'my label');
        $user2 = new User(654, 'joe user');
        $la = new LabelAndUser($label2, $user2);
        $file->addFileLabel($la);

        $dbUser = DbUser::factory()->create();
        $matches = $metadata->getMatchingUsers([321 => $dbUser->id], [123]);
        $this->assertEquals([321 => $dbUser->id], $matches);
    }

    public function testGetMatchingUsersIgnoreNotInMetadata()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);

        $dbUser = DbUser::factory()->create();
        $matches = $metadata->getMatchingUsers([321 => $dbUser->id, 432 => $dbUser->id]);
        $this->assertEquals([321 => $dbUser->id], $matches);
    }

    public function testGetMatchingLabelsByMap()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);

        $dbLabel = DbLabel::factory()->create();
        $matches = $metadata->getMatchingLabels([123 => $dbLabel->id]);
        $this->assertEquals([123 => $dbLabel->id], $matches);
    }

    public function testGetMatchingLabelsByUuid()
    {
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label = new Label(123, 'my label', uuid: $dbLabel->uuid);
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);

        $matches = $metadata->getMatchingLabels();
        $this->assertEquals([123 => $dbLabel->id], $matches);
    }

    public function testGetMatchingLabelsNoMatch()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label = new Label(123, 'my label', uuid: "398f42c6-0f24-38de-a1c6-3c467fcb4250");
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);

        $matches = $metadata->getMatchingLabels([123 => -1]);
        $this->assertEquals([123 => null], $matches);
    }

    public function testGetMatchingLabelsOnlyLabels()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label1 = new Label(123, 'my label');
        $user1 = new User(321, 'joe user');
        $la = new LabelAndUser($label1, $user1);
        $file->addFileLabel($la);
        $label2 = new Label(456, 'my label');
        $user2 = new User(654, 'joe user');
        $la = new LabelAndUser($label2, $user2);
        $file->addFileLabel($la);

        $dbLabel = DbLabel::factory()->create();
        $matches = $metadata->getMatchingLabels([123 => $dbLabel->id], [123]);
        $this->assertEquals([123 => $dbLabel->id], $matches);
    }

    public function testGetMatchingLabelsIgnoreNotInMetadata()
    {
        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('filename');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $la = new LabelAndUser($label, $user);
        $file->addFileLabel($la);

        $dbLabel = DbLabel::factory()->create();
        $matches = $metadata->getMatchingLabels([123 => $dbLabel->id, 234 => $dbLabel->id]);
        $this->assertEquals([123 => $dbLabel->id], $matches);
    }
}
