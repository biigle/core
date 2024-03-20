<?php

namespace Biigle\Tests\Services\MetadataParsing;

use Biigle\MediaType;
use Biigle\Services\MetadataParsing\Annotator;
use Biigle\Services\MetadataParsing\FileMetadata;
use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndAnnotator;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Biigle\Shape;
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
        $annotator = new Annotator(321, 'joe user');
        $la = new LabelAndAnnotator($label, $annotator);
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
        $annotator = new Annotator(321, 'joe user');
        $la = new LabelAndAnnotator($label, $annotator);
        $file->addFileLabel($la);
        $this->assertTrue($metadata->hasFileLabels());
    }
}
