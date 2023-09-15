<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes\ImageLabels;

use App;
use Biigle\Modules\Reports\Support\CsvFile;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageLabels\CsvReportGenerator;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Illuminate\Support\Str;
use Mockery;
use TestCase;
use ZipArchive;

class CsvReportGeneratorTest extends TestCase
{
    private $columns = [
        'image_label_id',
        'image_id',
        'filename',
        'longitude',
        'latitude',
        'user_id',
        'firstname',
        'lastname',
        'label_id',
        'label_name',
        'label_hierarchy',
        'created_at',
    ];

    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV image label report', $generator->getName());
        $this->assertEquals('csv_image_label_report', $generator->getFilename());
        $this->assertStringEndsWith('.zip', $generator->getFullFilename());
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create();

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $il = ImageLabelTest::create([
            'image_id' => ImageTest::create([
                'volume_id' => $volume->id,
                'filename' => 'foo.jpg',
            ])->id,
            'label_id' => $child->id,
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
                $il->id,
                $il->image_id,
                $il->image->filename,
                null,
                null,
                $il->user_id,
                $il->user->firstname,
                $il->user->lastname,
                $il->label_id,
                $child->name,
                "{$root->name} > {$child->name}",
                $il->created_at,
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

        $mock->shouldReceive('addFile')->once();
        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CsvReportGenerator;
        $generator->setSource($volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSeparateLabelTrees()
    {
        $tree1 = LabelTreeTest::create(['name' => 'tree1']);
        $tree2 = LabelTreeTest::create(['name' => 'tree2']);

        $label1 = LabelTest::create(['label_tree_id' => $tree1->id]);
        $label2 = LabelTest::create(['label_tree_id' => $tree2->id]);

        $image = ImageTest::create();

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

        $mock->shouldReceive('put')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $il1->id,
                $image->id,
                $image->filename,
                null,
                null,
                $il1->user_id,
                $il1->user->firstname,
                $il1->user->lastname,
                $label1->id,
                $label1->name,
                $label1->name,
                $il1->created_at,
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $il2->id,
                $image->id,
                $image->filename,
                null,
                null,
                $il2->user_id,
                $il2->user->firstname,
                $il2->user->lastname,
                $label2->id,
                $label2->name,
                $label2->name,
                $il2->created_at,
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
            ->with('abc', "{$tree1->id}-{$tree1->name}.csv");

        $mock->shouldReceive('addFile')
            ->once()
            ->with('def', "{$tree2->id}-{$tree2->name}.csv");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CsvReportGenerator([
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

        $image = ImageTest::create();

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

        $mock->shouldReceive('put')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $il1->id,
                $image->id,
                $image->filename,
                null,
                null,
                $il1->user_id,
                $il1->user->firstname,
                $il1->user->lastname,
                $il1->label->id,
                $il1->label->name,
                $il1->label->name,
                $il1->created_at,
            ]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $il2->id,
                $image->id,
                $image->filename,
                null,
                null,
                $il2->user_id,
                $il2->user->firstname,
                $il2->user->lastname,
                $il2->label->id,
                $il2->label->name,
                $il2->label->name,
                $il2->created_at,
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
            ->with('abc', "{$user1->id}-joe-jack-user.csv");

        $mock->shouldReceive('addFile')
            ->once()
            ->with('def', "{$user2->id}-jane-user.csv");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CsvReportGenerator([
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

        $generator = new CsvReportGenerator([
            'onlyLabels' => [$il1->label_id],
        ]);
        $generator->setSource($image->volume);
        $results = $generator->query()->get();
        $this->assertCount(1, $results);
        $this->assertEquals($il1->id, $results[0]->image_label_id);
    }

    public function testGenerateReportWithDeletedUser()
    {
        $user = UserTest::create([
            'firstname' => 'Joe Jack',
            'lastname' => 'User',
        ]);

        $image = ImageTest::create();

        $volName = Str::slug($image->volume->name);
        
        $il1 = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => null // deleted user
        ]);
        $il2 = ImageLabelTest::create([
            'image_id' => $image->id,
            'user_id' => $user->id
        ]);

        $this->assertNull($il1->usesr_id);
        $this->assertEquals($user->id, $il2->user_id);

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
                $il1->id,
                $image->id,
                $image->filename,
                null,
                null,
                null,
                null,
                null,
                $il1->label->id,
                $il1->label->name,
                $il1->label->name,
                $il1->created_at,
            ]);

            $mock->shouldReceive('put')
            ->once()
            ->with([
                $il2->id,
                $image->id,
                $image->filename,
                null,
                null,
                $il2->user_id,
                $il2->user->firstname,
                $il2->user->lastname,
                $il2->label->id,
                $il2->label->name,
                $il2->label->name,
                $il2->created_at,
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
            ->with('abc', "{$image->volume->id}-{$volName}.csv");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CsvReportGenerator();
        $generator->setSource($image->volume);
        $generator->generateReport('my/path');
    }
}
