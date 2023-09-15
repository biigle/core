<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Modules\Reports\Support\CsvFile;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageAnnotations\CocoReportGenerator;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Illuminate\Support\Str;
use Mockery;
use TestCase;
use ZipArchive;

class CocoReportGeneratorTest extends TestCase
{
    private $columns = [
        'annotation_label_id',
        'label_id',
        'label_name',
        'image_id',
        'filename',
        'image_longitude',
        'image_latitude',
        'shape_name',
        'points',
        'attributes',
    ];

    public function testProperties()
    {
        $generator = new CocoReportGenerator;
        $this->assertEquals('coco image annotation report', $generator->getName());
        $this->assertEquals('coco_image_annotation_report', $generator->getFilename());
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
        $al->annotation->image->save();

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $mock->shouldReceive('put')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al->id,
                $child->id,
                $child->name,
                $al->annotation->image_id,
                $al->annotation->image->filename,
                null,
                null,
                $al->annotation->shape->name,
                json_encode($al->annotation->points),
                json_encode(['image' => 'attrs'])
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$volume->id}-my-cool-volume.json");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CocoReportGenerator;
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSeparateLabelTrees()
    {
        $tree1 = LabelTreeTest::create(['name' => 'tree1']);
        $tree2 = LabelTreeTest::create(['name' => 'tree2']);

        $label1 = LabelTest::create(['label_tree_id' => $tree1->id]);
        $label2 = LabelTest::create(['label_tree_id' => $tree2->id]);

        $image = ImageTest::create();

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

        $mock->shouldReceive('put')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al1->id,
                $label1->id,
                $label1->name,
                $annotation->image_id,
                $annotation->image->filename,
                null,
                null,
                $annotation->shape->name,
                json_encode($annotation->points),
                null
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al2->id,
                $label2->id,
                $label2->name,
                $annotation->image_id,
                $annotation->image->filename,
                null,
                null,
                $annotation->shape->name,
                json_encode($annotation->points),
                null
            ]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$tree1->id}-{$tree1->name}.json");

        $mock->shouldReceive('addFile')
            ->once()
            ->with('def', "{$tree2->id}-{$tree2->name}.json");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CocoReportGenerator([
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
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

        $image = ImageTest::create();

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

        $mock->shouldReceive('put')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al1->id,
                $al1->label->id,
                $al1->label->name,
                $annotation->image_id,
                $annotation->image->filename,
                null,
                null,
                $annotation->shape->name,
                json_encode($annotation->points),
                null
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al2->id,
                $al2->label->id,
                $al2->label->name,
                $annotation->image_id,
                $annotation->image->filename,
                null,
                null,
                $annotation->shape->name,
                json_encode($annotation->points),
                null
            ]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$user1->id}-joe-jack-user.json");

        $mock->shouldReceive('addFile')
            ->once()
            ->with('def', "{$user2->id}-jane-user.json");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CocoReportGenerator([
            'separateUsers' => true,
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportWithDeletedUser()
    {
        $user = UserTest::create([
            'firstname' => 'Joe Jack',
            'lastname' => 'User',
        ]);

        $image = ImageTest::create();

        $volName = Str::slug($image->volume->name);

        $annotation = ImageAnnotationTest::create(['image_id' => $image->id]);
        
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id, 
            'user_id' => null // deleted user
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id, 
            'user_id' => $user->id
        ]);


        $mock = Mockery::mock();
        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $mock->shouldReceive('put')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al1->id,
                $al1->label->id,
                $al1->label->name,
                $annotation->image_id,
                $annotation->image->filename,
                null,
                null,
                $annotation->shape->name,
                json_encode($annotation->points),
                null
            ]);

            $mock->shouldReceive('put')
            ->once()
            ->with([
                $al2->id,
                $al2->label->id,
                $al2->label->name,
                $annotation->image_id,
                $annotation->image->filename,
                null,
                null,
                $annotation->shape->name,
                json_encode($annotation->points),
                null
            ]);

        $mock->shouldReceive('close')->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$image->volume->id}-{$volName}.json");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CocoReportGenerator();
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    
    }
}
