<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Services\Reports\File;
use Biigle\Services\Reports\Volumes\ImageAnnotations\AnnotationLocationReportGenerator;
use Biigle\Shape;
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

class AnnotationLocationReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new AnnotationLocationReportGenerator;
        $this->assertSame('annotation location image annotation report', $generator->getName());
        $this->assertSame('annotation_location_image_annotation_report', $generator->getFilename());
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

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'lat' => 51.0,
            'lng' => 0.0,
            'attrs' => [
                'width' => 100,
                'height' => 100,
                'metadata' => [
                    'yaw' => 90,
                    'distance_to_ground' => 10,
                ],
            ],
        ]);

        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'points' => [10, 10],
            'image_id' => $image->id,
        ]);

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $child->id,
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $jsonContent = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [0.000114194969290087, 51.00007186522273],
            ],
            'properties' => [
                '_id' => $al->id,
                '_image_id' => $image->id,
                '_image_filename' => 'test-image.jpg',
                '_image_latitude' => $image->lat,
                '_image_longitude' => $image->lng,
                '_label_name' => $child->name,
                '_label_id' => $child->id,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent));

        $mock->shouldReceive('close')
            ->once();

        App::singleton(File::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$volume->id}-my-cool-volume.ndjson");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new AnnotationLocationReportGenerator;
        $generator->setSource($volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportCircle()
    {
        $volume = VolumeTest::create();

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'lat' => 51.0,
            'lng' => 0.0,
            'attrs' => [
                'width' => 100,
                'height' => 100,
                'metadata' => [
                    'yaw' => 90,
                    'distance_to_ground' => 10,
                ],
            ],
        ]);

        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::circleId(),
            'points' => [10, 10, 10],
            'image_id' => $image->id,
        ]);

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $child->id,
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $jsonContent = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [0.000114194969290087, 51.00007186522273],
            ],
            'properties' => [
                '_id' => $al->id,
                '_image_id' => $image->id,
                '_image_filename' => 'test-image.jpg',
                '_image_latitude' => $image->lat,
                '_image_longitude' => $image->lng,
                '_label_name' => $child->name,
                '_label_id' => $child->id,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent));

        $mock->shouldReceive('close')
            ->once();

        App::singleton(File::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once();

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new AnnotationLocationReportGenerator;
        $generator->setSource($volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportLineString()
    {
        $volume = VolumeTest::create();

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'lat' => 51.0,
            'lng' => 0.0,
            'attrs' => [
                'width' => 100,
                'height' => 100,
                'metadata' => [
                    'yaw' => 90,
                    'distance_to_ground' => 10,
                ],
            ],
        ]);

        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::lineId(),
            'points' => [10, 10, 20, 20],
            'image_id' => $image->id,
        ]);

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $child->id,
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $jsonContent = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'LineString',
                'coordinates' => [
                    [0.000114194969290087, 51.00007186522273],
                    [8.564622696756525e-5, 51.000053898917045],
                ],
            ],
            'properties' => [
                '_id' => $al->id,
                '_image_id' => $image->id,
                '_image_filename' => 'test-image.jpg',
                '_image_latitude' => $image->lat,
                '_image_longitude' => $image->lng,
                '_label_name' => $child->name,
                '_label_id' => $child->id,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent));

        $mock->shouldReceive('close')
            ->once();

        App::singleton(File::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once();

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new AnnotationLocationReportGenerator;
        $generator->setSource($volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportPolygon()
    {
        $volume = VolumeTest::create();

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'lat' => 51.0,
            'lng' => 0.0,
            'attrs' => [
                'width' => 100,
                'height' => 100,
                'metadata' => [
                    'yaw' => 90,
                    'distance_to_ground' => 10,
                ],
            ],
        ]);

        $a = ImageAnnotationTest::create([
            'shape_id' => Shape::polygonId(),
            'points' => [10, 10, 20, 20, 30, 30],
            'image_id' => $image->id,
        ]);

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $child->id,
            'annotation_id' => $a->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $jsonContent = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Polygon',
                'coordinates' => [[
                    [0.000114194969290087, 51.00007186522273],
                    [8.564622696756525e-5, 51.000053898917045],
                    [5.70974846450435e-5, 51.00003593261137],
                    [0.000114194969290087, 51.00007186522273],
                ]],
            ],
            'properties' => [
                '_id' => $al->id,
                '_image_id' => $image->id,
                '_image_filename' => 'test-image.jpg',
                '_image_latitude' => $image->lat,
                '_image_longitude' => $image->lng,
                '_label_name' => $child->name,
                '_label_id' => $child->id,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent));

        $mock->shouldReceive('close')
            ->once();

        App::singleton(File::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once();

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new AnnotationLocationReportGenerator;
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

        App::singleton(File::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')->once();
        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new AnnotationLocationReportGenerator;
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
            'lat' => 51.0,
            'lng' => 0.0,
            'attrs' => [
                'width' => 100,
                'height' => 100,
                'metadata' => [
                    'yaw' => 90,
                    'distance_to_ground' => 10,
                ],
            ],
        ]);

        $annotation = ImageAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'points' => [10, 10],
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
                'coordinates' => [0.000114194969290087, 51.00007186522273],
            ],
            'properties' => [
                '_id' => $al1->id,
                '_image_id' => $image->id,
                '_image_filename' => 'test-image.jpg',
                '_image_latitude' => $image->lat,
                '_image_longitude' => $image->lng,
                '_label_name' => $label1->name,
                '_label_id' => $label1->id,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent));

        $jsonContent['properties']['_id'] = $al2->id;
        $jsonContent['properties']['_label_name'] = $label2->name;
        $jsonContent['properties']['_label_id'] = $label2->id;

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent));

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(File::class, fn () => $mock);

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

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new AnnotationLocationReportGenerator([
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($image->volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSeparateUsers()
    {
        $user1 = UserTest::create([
            'firstname' => 'John Jack',
            'lastname' => 'User',
        ]);

        $user2 = UserTest::create([
            'firstname' => 'Jane',
            'lastname' => 'User',
        ]);

        $image = ImageTest::create([
            'lat' => 51.0,
            'lng' => 0.0,
            'attrs' => [
                'width' => 100,
                'height' => 100,
                'metadata' => [
                    'yaw' => 90,
                    'distance_to_ground' => 10,
                ],
            ],
        ]);

        $annotation = ImageAnnotationTest::create([
            'shape_id' => Shape::pointId(),
            'points' => [10, 10],
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
                'coordinates' => [0.000114194969290087, 51.00007186522273],
            ],
            'properties' => [
                '_id' => $al1->id,
                '_image_id' => $image->id,
                '_image_filename' => 'test-image.jpg',
                '_image_latitude' => $image->lat,
                '_image_longitude' => $image->lng,
                '_label_name' => $al1->label->name,
                '_label_id' => $al1->label->id,
            ],
        ];

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent));

        $jsonContent['properties']['_id'] = $al2->id;
        $jsonContent['properties']['_label_name'] = $al2->label->name;
        $jsonContent['properties']['_label_id'] = $al2->label->id;

        $mock->shouldReceive('put')
            ->once()
            ->with(json_encode($jsonContent));

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(File::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$al1->user->id}-john-jack-user.ndjson");

        $mock->shouldReceive('addFile')
            ->once()
            ->with('def', "{$al2->user->id}-jane-user.ndjson");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new AnnotationLocationReportGenerator([
            'separateUsers' => true,
        ]);
        $generator->setSource($image->volume);
        $generator->generateReport('my/path');
    }
}
