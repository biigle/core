<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Modules\Reports\Support\File;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations\ImageLocationReportGenerator;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Mockery;
use TestCase;
use ZipArchive;

class ImageLocationReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ImageLocationReportGenerator;
        $this->assertSame('image location image annotation report', $generator->getName());
        $this->assertSame('image_location_image_annotation_report', $generator->getFilename());
        $this->assertStringEndsWith('.zip', $generator->getFullFilename());
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $child->id,
        ]);
        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->attrs = ['image' => 'attrs'];
        $al->annotation->image->lng = 80.2;
        $al->annotation->image->lat = 52.5;
        $al->annotation->image->save();

        ImageAnnotationLabelTest::create([
            'label_id' => $child->id,
            'annotation_id' => $al->annotation_id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $jsonContent = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [80.2, 52.5],
            ],
            'properties' => [
                '_id' => $al->annotation->image_id,
                '_filename' => 'test-image.jpg',
                "{$child->name} (#{$child->id})" => 2,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent)."\n");

        $mock->shouldReceive('close')
            ->once();

        App::singleton(File::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$volume->id}-my-cool-volume.ndjson");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new ImageLocationReportGenerator;
        $generator->setSource($volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportNoCoordinates()
    {
        $volume = VolumeTest::create();

        $al = ImageAnnotationLabelTest::create();
        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->save();

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $mock->shouldReceive('close')
            ->once();

        App::singleton(File::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')->once();
        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new ImageLocationReportGenerator;
        $generator->setSource($volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSeparateLabelTrees()
    {
        $tree1 = LabelTreeTest::create(['name' => 'tree1']);
        $tree2 = LabelTreeTest::create(['name' => 'tree2']);

        $label1 = LabelTest::create(['label_tree_id' => $tree1->id]);
        $label2 = LabelTest::create(['label_tree_id' => $tree2->id]);

        $image = ImageTest::create([
            'lng' => 80.2,
            'lat' => 52.5,
        ]);

        $annotation = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label1->id,
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label2->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('getPath')
            ->twice()
            ->andReturn('abc', 'def');

        $jsonContent = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [80.2, 52.5],
            ],
            'properties' => [
                '_id' => $image->id,
                '_filename' => $image->filename,
                "{$label1->name} (#{$label1->id})" => 1,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent)."\n");

        $jsonContent = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [80.2, 52.5],
            ],
            'properties' => [
                '_id' => $image->id,
                '_filename' => $image->filename,
                "{$label2->name} (#{$label2->id})" => 1,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent)."\n");

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(File::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$tree1->id}-{$tree1->name}.ndjson");

        $mock->shouldReceive('addFile')
            ->once()
            ->with('def', "{$tree2->id}-{$tree2->name}.ndjson");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new ImageLocationReportGenerator([
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($image->volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSeparateUsers()
    {
        $user1 = UserTest::create([
            'firstname' => 'Joe Jack',
            'lastname' => 'User',
        ]);

        $user2 = UserTest::create([
            'firstname' => 'Jane',
            'lastname' => 'User',
        ]);

        $image = ImageTest::create([
            'lng' => 80.2,
            'lat' => 52.5,
        ]);

        $annotation = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $user1->id,
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $user2->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('getPath')
            ->twice()
            ->andReturn('abc', 'def');

        $jsonContent = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [80.2, 52.5],
            ],
            'properties' => [
                '_id' => $image->id,
                '_filename' => $image->filename,
                "{$al1->label->name} (#{$al1->label->id})" => 1,
                "{$al2->label->name} (#{$al2->label->id})" => 0,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent)."\n");

        $jsonContent = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [80.2, 52.5],
            ],
            'properties' => [
                '_id' => $image->id,
                '_filename' => $image->filename,
                "{$al1->label->name} (#{$al1->label->id})" => 0,
                "{$al2->label->name} (#{$al2->label->id})" => 1,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent)."\n");

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(File::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$user1->id}-joe-jack-user.ndjson");

        $mock->shouldReceive('addFile')
            ->once()
            ->with('def', "{$user2->id}-jane-user.ndjson");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new ImageLocationReportGenerator([
            'separateUsers' => true,
        ]);
        $generator->setSource($image->volume);
        $generator->generateReport('my/path');
    }
}
