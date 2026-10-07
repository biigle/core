<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use Biigle\Services\Reports\Volumes\ImageAnnotations\YoloReportGenerator;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\VolumeTest;
use TestCase;
use ZipArchive;

class YoloReportGeneratorTest extends TestCase
{
    protected $path;

    public function setUp(): void
    {
        parent::setUp();
        $this->path = tempnam(sys_get_temp_dir(), 'yolo_report_test');
    }

    public function tearDown(): void
    {
        @unlink($this->path);
        parent::tearDown();
    }

    public function testProperties()
    {
        $generator = new YoloReportGenerator;
        $this->assertSame('YOLO image annotation report', $generator->getName());
        $this->assertSame('yolo_image_annotation_report', $generator->getFilename());
        $this->assertStringEndsWith('.zip', $generator->getFullFilename());
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create(['name' => 'My Cool Volume']);
        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => 'sub/image.jpg?token=a.b',
            'attrs' => ['width' => 200, 'height' => 100],
        ]);
        $label1 = LabelTest::create(['name' => 'b: "label"']);
        $label2 = LabelTest::create(['name' => 'a label']);

        $this->annotate($image, Shape::rectangleId(), [10, 10, 30, 10, 30, 30, 10, 30], $label2);
        $this->annotate($image, Shape::circleId(), [100, 50, 10], $label1);
        // Clipped to the image.
        $this->annotate($image, Shape::polygonId(), [190, 90, 210, 90, 210, 110], $label1);
        // Axis-aligned ellipse with semi-axes 20 (x) and 10 (y).
        $this->annotate($image, Shape::ellipseId(), [80, 50, 100, 40, 120, 50, 100, 60], $label1);
        // Points are not supported.
        $this->annotate($image, Shape::pointId(), [50, 50], $label1);

        $generator = new YoloReportGenerator([
            'yoloImagePath' => '/my/images/',
            'yoloSplit' => [1, 0, 0],
        ]);
        $generator->setSource($volume);
        $generator->generateReport($this->path);

        $zip = $this->openZip();

        $classes = $zip->getFromName('classes.txt');
        $first = min($label1->id, $label2->id) === $label1->id ? $label1 : $label2;
        $second = $first->is($label1) ? $label2 : $label1;
        $this->assertSame("{$first->name}\n{$second->name}\n", $classes);

        $index1 = $first->is($label1) ? 0 : 1;
        $index2 = 1 - $index1;
        $expect = [
            "{$index2} 0.100000 0.200000 0.100000 0.200000",
            "{$index1} 0.500000 0.500000 0.100000 0.200000",
            "{$index1} 0.975000 0.950000 0.050000 0.100000",
            "{$index1} 0.500000 0.500000 0.200000 0.200000",
        ];
        $lines = explode("\n", trim($zip->getFromName('labels/train/sub/image.txt')));
        $this->assertSame($expect, $lines);

        $yaml = $zip->getFromName('data.yaml');
        $this->assertStringContainsString("train: images/train\nval: images/val\n", $yaml);
        $this->assertStringNotContainsString('test:', $yaml);
        $this->assertStringContainsString("nc: 2\n", $yaml);
        $this->assertStringContainsString("  {$index1}: \"b: \\\"label\\\"\"\n", $yaml);
        $this->assertStringContainsString("  {$index2}: \"a label\"\n", $yaml);

        $this->assertSame('/my/images/sub/image.jpg', $zip->getFromName('images/train/sub/image.jpg'));
        $zip->getExternalAttributesName('images/train/sub/image.jpg', $os, $attr);
        $this->assertSame(ZipArchive::OPSYS_UNIX, $os);
        $this->assertSame(0120000, ($attr >> 16) & 0170000);

        $this->assertStringContainsString('My Cool Volume', $zip->getFromName('README.txt'));
        $zip->close();
    }

    public function testGenerateReportWithoutImagePath()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'attrs' => ['width' => 200, 'height' => 100],
        ]);
        $this->annotate($image, Shape::circleId(), [100, 50, 10], LabelTest::create());

        $generator = new YoloReportGenerator(['yoloSplit' => [1, 0, 0]]);
        $generator->setSource($volume);
        $generator->generateReport($this->path);

        $names = $this->getNames();
        $this->assertContains('labels/train/'.pathinfo($image->filename, PATHINFO_FILENAME).'.txt', $names);
        $this->assertEmpty(array_filter($names, fn ($name) => str_starts_with($name, 'images/')));
    }

    public function testGenerateReportSkipImagesWithoutDimensions()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create(['volume_id' => $volume->id, 'attrs' => []]);
        $this->annotate($image, Shape::circleId(), [100, 50, 10], LabelTest::create());

        $generator = new YoloReportGenerator;
        $generator->setSource($volume);
        $generator->generateReport($this->path);

        $names = $this->getNames();
        $this->assertEmpty(array_filter($names, fn ($name) => str_starts_with($name, 'labels/')));
        $this->assertContains('data.yaml', $names);
    }

    public function testGenerateReportSplit()
    {
        $volume = VolumeTest::create();
        $label = LabelTest::create();
        for ($i = 0; $i < 10; $i++) {
            $image = ImageTest::create([
                'volume_id' => $volume->id,
                'filename' => "image{$i}.jpg",
                'attrs' => ['width' => 200, 'height' => 100],
            ]);
            $this->annotate($image, Shape::circleId(), [100, 50, 10], $label);
        }

        $generator = new YoloReportGenerator(['yoloSplit' => [0.5, 0.3, 0.2]]);
        $generator->setSource($volume);
        $generator->generateReport($this->path);
        $names = $this->getNames();

        $count = fn ($split) => count(array_filter($names, fn ($name) => str_starts_with($name, "labels/{$split}/")));
        $this->assertSame(5, $count('train'));
        $this->assertSame(3, $count('val'));
        $this->assertSame(2, $count('test'));

        // The split is the same if the report is generated again.
        $generator->generateReport($this->path);
        $this->assertSame($names, $this->getNames());
    }

    public function testGenerateReportSeparateLabelTrees()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'attrs' => ['width' => 200, 'height' => 100],
        ]);
        $tree1 = LabelTreeTest::create(['name' => 'Tree 1']);
        $tree2 = LabelTreeTest::create(['name' => 'Tree 2']);
        $this->annotate($image, Shape::circleId(), [100, 50, 10], LabelTest::create(['label_tree_id' => $tree1->id]));
        $this->annotate($image, Shape::circleId(), [100, 50, 10], LabelTest::create(['label_tree_id' => $tree2->id]));

        $generator = new YoloReportGenerator(['separateLabelTrees' => true]);
        $generator->setSource($volume);
        $generator->generateReport($this->path);

        $names = $this->getNames();
        $this->assertContains("{$tree1->id}-tree-1/data.yaml", $names);
        $this->assertContains("{$tree2->id}-tree-2/data.yaml", $names);
        $this->assertNotContains('data.yaml', $names);
    }

    protected function annotate($image, $shapeId, $points, $label)
    {
        $annotation = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => $shapeId,
            'points' => $points,
        ]);

        return ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label->id,
        ]);
    }

    protected function openZip()
    {
        $zip = new ZipArchive;
        $this->assertTrue($zip->open($this->path));

        return $zip;
    }

    protected function getNames()
    {
        $zip = $this->openZip();
        $names = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $names[] = $zip->getNameIndex($i);
        }
        $zip->close();
        sort($names);

        return $names;
    }
}
