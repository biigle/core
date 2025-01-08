<?php

namespace Biigle\Tests\Services\Reports\Volumes\VideoLabels;

use App;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\Volumes\VideoLabels\CsvReportGenerator;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Illuminate\Support\Str;
use Mockery;
use TestCase;
use ZipArchive;

class CsvReportGeneratorTest extends TestCase
{
    private $columns = [
        'video_label_id',
        'video_id',
        'filename',
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
        $this->assertSame('CSV video label report', $generator->getName());
        $this->assertSame('csv_video_label_report', $generator->getFilename());
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

        $il = VideoLabelTest::create([
            'video_id' => VideoTest::create([
                'volume_id' => $volume->id,
                'filename' => 'foo.mp4',
            ])->id,
            'label_id' => $child->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $mock->shouldReceive('putCsv')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $il->id,
                $il->video_id,
                $il->video->filename,
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

        App::singleton(CsvFile::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')->once();
        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $mock);

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

        $video = VideoTest::create();

        $il1 = VideoLabelTest::create([
            'video_id' => $video->id,
            'label_id' => $label1->id,
        ]);
        $il2 = VideoLabelTest::create([
            'video_id' => $video->id,
            'label_id' => $label2->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('getPath')
            ->twice()
            ->andReturn('abc', 'def');

        $mock->shouldReceive('putCsv')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $il1->id,
                $video->id,
                $video->filename,
                $il1->user_id,
                $il1->user->firstname,
                $il1->user->lastname,
                $label1->id,
                $label1->name,
                $label1->name,
                $il1->created_at,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $il2->id,
                $video->id,
                $video->filename,
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

        App::singleton(CsvFile::class, fn () => $mock);

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

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new CsvReportGenerator([
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($video->volume);
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

        $video = VideoTest::create();

        $il1 = VideoLabelTest::create([
            'video_id' => $video->id,
            'user_id' => $user1->id,
        ]);
        $il2 = VideoLabelTest::create([
            'video_id' => $video->id,
            'user_id' => $user2->id,
        ]);

        $mock = Mockery::mock();
        $mock->shouldReceive('getPath')
            ->twice()
            ->andReturn('abc', 'def');

        $mock->shouldReceive('putCsv')
            ->twice()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $il1->id,
                $video->id,
                $video->filename,
                $il1->user_id,
                $il1->user->firstname,
                $il1->user->lastname,
                $il1->label->id,
                $il1->label->name,
                $il1->label->name,
                $il1->created_at,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $il2->id,
                $video->id,
                $video->filename,
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

        App::singleton(CsvFile::class, fn () => $mock);

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

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new CsvReportGenerator([
            'separateUsers' => true,
        ]);
        $generator->setSource($video->volume);
        $generator->generateReport('my/path');
    }

    public function testRestrictToLabels()
    {
        $video = VideoTest::create();
        $il1 = VideoLabelTest::create(['video_id' => $video->id]);
        $il2 = VideoLabelTest::create(['video_id' => $video->id]);

        $generator = new CsvReportGenerator([
            'onlyLabels' => [$il1->label_id],
        ]);
        $generator->setSource($video->volume);
        $results = $generator->query()->get();
        $this->assertCount(1, $results);
        $this->assertSame($il1->id, $results[0]->video_label_id);
    }

    public function testGenerateReportWithDeletedUser()
    {
        $user = UserTest::create([
            'firstname' => 'Joe Jack',
            'lastname' => 'User',
        ]);

        $video = VideoTest::create();

        $volName = Str::slug($video->volume->name);
        
        $il1 = VideoLabelTest::create([
            'video_id' => $video->id,
            'user_id' => null // deleted user
        ]);
        $il2 = VideoLabelTest::create([
            'video_id' => $video->id,
            'user_id' => $user->id
        ]);

        $mock = Mockery::mock();
        
        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $mock->shouldReceive('putCsv')
            ->once()
            ->with($this->columns);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $il1->id,
                $video->id,
                $video->filename,
                null,
                null,
                null,
                $il1->label->id,
                $il1->label->name,
                $il1->label->name,
                $il1->created_at,
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $il2->id,
                $video->id,
                $video->filename,
                $il2->user_id,
                $il2->user->firstname,
                $il2->user->lastname,
                $il2->label->id,
                $il2->label->name,
                $il2->label->name,
                $il2->created_at,
            ]);

        $mock->shouldReceive('close')->once();

        App::singleton(CsvFile::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$video->volume->id}-{$volName}.csv");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new CsvReportGenerator();
        $generator->setSource($video->volume);
        $generator->generateReport('my/path');
    }
}
