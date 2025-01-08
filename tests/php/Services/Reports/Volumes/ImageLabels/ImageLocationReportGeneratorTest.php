<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageLabels;

use App;
use Biigle\Services\Reports\File;
use Biigle\Services\Reports\Volumes\ImageLabels\ImageLocationReportGenerator;
use Biigle\Tests\ImageLabelTest;
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
        $this->assertSame('image location image label report', $generator->getName());
        $this->assertSame('image_location_image_label_report', $generator->getFilename());
        $this->assertStringEndsWith('.zip', $generator->getFullFilename());
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create(['name' => 'volume1']);

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $il = ImageLabelTest::create([
            'image_id' => ImageTest::create([
                'volume_id' => $volume->id,
                'filename' => 'foo.jpg',
                'lng' => 80.2,
                'lat' => 52.5,
            ])->id,
            'label_id' => $child->id,
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
                '_id' => $il->image_id,
                '_filename' => 'foo.jpg',
                "{$child->name} (#{$child->id})" => 1,
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
            ->with('abc', "{$volume->id}-{$volume->name}.ndjson");
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

        $il = ImageLabelTest::create([
            'image_id' => ImageTest::create([
                'volume_id' => $volume->id,
            ])->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $mock->shouldReceive('put')->never();

        $mock->shouldReceive('close')->once();

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

        $il1 = ImageLabelTest::create([
            'image_id' => $image->id,
            'label_id' => $label1->id,
        ]);
        $il2 = ImageLabelTest::create([
            'image_id' => $image->id,
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

        $il1 = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $user1->id,
        ]);
        $il2 = ImageLabelTest::create([
            'image_id' => $image->id,
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
                "{$il1->label->name} (#{$il1->label->id})" => 1,
                "{$il2->label->name} (#{$il2->label->id})" => 0,
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
                "{$il1->label->name} (#{$il1->label->id})" => 0,
                "{$il2->label->name} (#{$il2->label->id})" => 1,
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

    public function testRestrictToLabels()
    {
        $image = ImageTest::create();
        $il1 = ImageLabelTest::create(['image_id' => $image->id]);
        $il2 = ImageLabelTest::create(['image_id' => $image->id]);

        $generator = new ImageLocationReportGenerator([
            'onlyLabels' => [$il1->label_id],
        ]);
        $generator->setSource($image->volume);
        $results = $generator->query()->get();
        $this->assertCount(1, $results);
        $this->assertSame($il1->image_id, $results[0]->image_id);
        $this->assertSame($il1->label_id, $results[0]->label_id);
    }
}
