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
            'video_link' => $volume->video_link,
            'gis_link' => $volume->gis_link,
            'doi' => $volume->doi,
            'images' => [[
                'id' => $image->id,
                'filename' => $image->filename,
            ]],
            'annotations' => [[
                'image_id' => $image->id,
                'shape_id' => $annotation->shape_id,
                'created_at' => $annotation->created_at,
                'updated_at' => $annotation->updated_at,
                'points' => json_encode($annotation->points),
            ]],
            'annotationLabels' => [[
                'annotation_id' => $annotation->id,
                'label_id' => $annotationLabel->label_id,
                'user_id' => $annotationLabel->user_id,
                'confidence' => $annotationLabel->confidence,
                'created_at' => $annotationLabel->created_at,
                'updated_at' => $annotationLabel->updated_at,
            ]],
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

        $this->assertCount(2, $exports);
        $userContent = $exports[0]->getContent();
        $this->assertEquals($annotationLabel->user->id, $userContent[0]['id']);

        $labelTreeContent = $exports[1]->getContent();
        $this->assertEquals($annotationLabel->label->label_tree_id, $labelTreeContent[0]['id']);
    }
}
