<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use File;
use TestCase;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Modules\Sync\Support\Export\VolumeExport;

class VolumeExportTest extends TestCase
{
    public function testGetContent()
    {
        $annotationLabel = AnnotationLabelTest::create();
        $annotation = $annotationLabel->annotation;
        $image = $annotation->image;
        $volume = $image->volume;

        $export = new VolumeExport([$volume->id]);
        $expect = [[
            'id' => $volume->id,
            'name' => $volume->name,
            'media_type_id' => $volume->media_type_id,
            'url' => $volume->url,
            'attrs' => $volume->attrs,
        ]];

        $this->assertEquals($expect, $export->getContent());
    }

    public function testGetAdditionalExports()
    {
        $annotationLabel = AnnotationLabelTest::create();
        $annotation = $annotationLabel->annotation;
        $image = $annotation->image;
        $imageLabel = ImageLabelTest::create(['image_id' => $image->id]);
        $volume = $image->volume;

        $exports = (new VolumeExport([$volume->id]))->getAdditionalExports();

        $this->assertCount(6, $exports);
        $userContent = $exports[0]->getContent();
        $this->assertEquals($annotationLabel->user->id, $userContent[0]['id']);
        $this->assertEquals($imageLabel->user->id, $userContent[1]['id']);

        $labelTreeContent = $exports[1]->getContent();
        $this->assertEquals($annotationLabel->label->label_tree_id, $labelTreeContent[0]['id']);
        $this->assertEquals($imageLabel->label->label_tree_id, $labelTreeContent[1]['id']);

        $path = $exports[2]->getContent();
        $this->assertContains('image_export', $path);
        $this->assertContains($image->filename, File::get($path));

        $path = $exports[3]->getContent();
        $this->assertContains('annotation_export', $path);
        $this->assertContains("{$annotation->id}", File::get($path));

        $path = $exports[4]->getContent();
        $this->assertContains('annotation_label_export', $path);
        $this->assertContains("{$annotationLabel->annotation_id},{$annotationLabel->label_id}", File::get($path));

        $path = $exports[5]->getContent();
        $this->assertContains('image_label_export', $path);
        $this->assertContains("{$imageLabel->image_id},{$imageLabel->label_id}", File::get($path));
    }
}
