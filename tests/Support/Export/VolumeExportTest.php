<?php

namespace Biigle\Tests\Modules\Sync\Support\Export;

use Biigle\Modules\Sync\Support\Export\VolumeExport;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\ImageLabelTest;
use File;
use TestCase;

class VolumeExportTest extends TestCase
{
    public function testGetContent()
    {
        $annotationLabel = AnnotationLabelTest::create();
        $annotation = $annotationLabel->annotation;
        $image = $annotation->image;
        $volume = $image->volume;
        $volume->attrs = ['doi' => 'my-doi'];
        $volume->save();

        $export = new VolumeExport([$volume->id]);
        $expect = [[
            'id' => $volume->id,
            'name' => $volume->name,
            'media_type_id' => $volume->media_type_id,
            'url' => $volume->url,
            'attrs' => ['doi' => 'my-doi'],
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
        $userIds = array_map(function ($user) {
            return $user['id'];
        }, $userContent);
        $this->assertContains($annotationLabel->user->id, $userIds);
        $this->assertContains($imageLabel->user->id, $userIds);

        $labelTreeContent = $exports[1]->getContent();
        $ids = array_map(function ($labelTree) {
            return $labelTree['id'];
        }, $labelTreeContent);
        $this->assertContains($annotationLabel->label->label_tree_id, $ids);
        $this->assertContains($imageLabel->label->label_tree_id, $ids);

        $path = $exports[2]->getContent();
        $this->assertStringContainsString('image_export', $path);
        $this->assertStringContainsString($image->filename, File::get($path));

        $path = $exports[3]->getContent();
        $this->assertStringContainsString('annotation_export', $path);
        $this->assertStringContainsString("{$annotation->id}", File::get($path));

        $path = $exports[4]->getContent();
        $this->assertStringContainsString('annotation_label_export', $path);
        $this->assertStringContainsString("{$annotationLabel->annotation_id},{$annotationLabel->label_id}", File::get($path));

        $path = $exports[5]->getContent();
        $this->assertStringContainsString('image_label_export', $path);
        $this->assertStringContainsString("{$imageLabel->image_id},{$imageLabel->label_id}", File::get($path));
    }
}
