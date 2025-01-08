<?php

namespace Biigle\Tests\Services\Export;

use Biigle\MediaType;
use Biigle\Services\Export\VolumeExport;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VolumeTest;
use File;
use TestCase;

class VolumeExportTest extends TestCase
{
    public function testGetContent()
    {
        $imageVolume = VolumeTest::create([
            'attrs' => ['doi' => 'my-doi'],
        ]);

        $videoVolume = VolumeTest::create([
            'media_type_id' => MediaType::videoId(),
        ]);

        $export = new VolumeExport([$imageVolume->id, $videoVolume->id]);
        $expect = [
            [
                'id' => $imageVolume->id,
                'name' => $imageVolume->name,
                'media_type_name' => 'image',
                'url' => $imageVolume->url,
                'attrs' => ['doi' => 'my-doi'],
            ],
            [
                'id' => $videoVolume->id,
                'name' => $videoVolume->name,
                'media_type_name' => 'video',
                'url' => $videoVolume->url,
                'attrs' => null,
            ],
        ];

        $this->assertEquals($expect, $export->getContent());
    }

    public function testGetAdditionalExports()
    {
        $imageAnnotationLabel = ImageAnnotationLabelTest::create();
        $imageAnnotation = $imageAnnotationLabel->annotation;
        $image = $imageAnnotation->image;
        $imageLabel = ImageLabelTest::create(['image_id' => $image->id]);
        $imageVolume = $image->volume;

        $videoAnnotationLabel = VideoAnnotationLabelTest::create();
        $videoAnnotation = $videoAnnotationLabel->annotation;
        $video = $videoAnnotation->video;
        $videoLabel = VideoLabelTest::create(['video_id' => $video->id]);
        $videoVolume = $video->volume;

        $exports = (new VolumeExport([$imageVolume->id, $videoVolume->id]))
            ->getAdditionalExports();

        $this->assertCount(10, $exports);
        $userContent = $exports[0]->getContent();
        $userIds = array_map(fn ($user) => $user['id'], $userContent);
        $this->assertContains($imageAnnotationLabel->user->id, $userIds);
        $this->assertContains($imageLabel->user->id, $userIds);
        $this->assertContains($videoAnnotationLabel->user->id, $userIds);
        $this->assertContains($videoLabel->user->id, $userIds);

        $labelTreeContent = $exports[1]->getContent();
        $ids = array_map(fn ($labelTree) => $labelTree['id'], $labelTreeContent);
        $this->assertContains($imageAnnotationLabel->label->label_tree_id, $ids);
        $this->assertContains($imageLabel->label->label_tree_id, $ids);
        $this->assertContains($videoAnnotationLabel->label->label_tree_id, $ids);
        $this->assertContains($videoLabel->label->label_tree_id, $ids);

        $path = $exports[2]->getContent();
        $this->assertStringContainsString('image_export', $path);
        $this->assertStringContainsString($image->filename, File::get($path));

        $path = $exports[3]->getContent();
        $this->assertStringContainsString('image_annotation_export', $path);
        $this->assertStringContainsString("{$imageAnnotation->id}", File::get($path));

        $path = $exports[4]->getContent();
        $this->assertStringContainsString('image_annotation_label_export', $path);
        $this->assertStringContainsString("{$imageAnnotationLabel->annotation_id},{$imageAnnotationLabel->label_id}", File::get($path));

        $path = $exports[5]->getContent();
        $this->assertStringContainsString('image_label_export', $path);
        $this->assertStringContainsString("{$imageLabel->image_id},{$imageLabel->label_id}", File::get($path));

        $path = $exports[6]->getContent();
        $this->assertStringContainsString('video_export', $path);
        $this->assertStringContainsString($video->filename, File::get($path));

        $path = $exports[7]->getContent();
        $this->assertStringContainsString('video_annotation_export', $path);
        $this->assertStringContainsString("{$videoAnnotation->id}", File::get($path));

        $path = $exports[8]->getContent();
        $this->assertStringContainsString('video_annotation_label_export', $path);
        $this->assertStringContainsString("{$videoAnnotationLabel->annotation_id},{$videoAnnotationLabel->label_id}", File::get($path));

        $path = $exports[9]->getContent();
        $this->assertStringContainsString('video_label_export', $path);
        $this->assertStringContainsString("{$videoLabel->image_id},{$videoLabel->label_id}", File::get($path));
    }
}
