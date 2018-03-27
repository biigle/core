<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use TestCase;
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
        $volume = $image->volume;

        $exports = (new VolumeExport([$volume->id]))->getAdditionalExports();

        $this->assertCount(5, $exports);
        $userContent = $exports[0]->getContent();
        $this->assertEquals($annotationLabel->user->id, $userContent[0]['id']);

        $labelTreeContent = $exports[1]->getContent();
        $this->assertEquals($annotationLabel->label->label_tree_id, $labelTreeContent[0]['id']);

        $this->assertContains('image_export', $exports[2]->getContent());
        $this->assertContains('annotation_export', $exports[3]->getContent());
        $this->assertContains('annotation_label_export', $exports[4]->getContent());
    }
}
