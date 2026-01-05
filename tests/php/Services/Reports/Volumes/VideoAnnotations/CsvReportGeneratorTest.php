<?php

namespace Biigle\Tests\Services\Reports\Volumes\VideoAnnotations;

use App;
use Biigle\MediaType;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\Volumes\VideoAnnotations\CsvReportGenerator;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Illuminate\Support\Str;
use Mockery;
use TestCase;
use ZipArchive;

class CsvReportGeneratorTest extends TestCase
{
    private $columns = [
        'video_annotation_label_id',
        'label_id',
        'label_name',
        'label_hierarchy',
        'user_id',
        'firstname',
        'lastname',
        'video_id',
        'video_filename',
        'shape_id',
        'shape_name',
        'points',
        'frames',
        'annotation_id',
        'created_at',
        'attributes',
    ];

    private $columnsSkipAttributes = [
        'video_annotation_label_id',
        'label_id',
        'label_name',
        'label_hierarchy',
        'user_id',
        'firstname',
        'lastname',
        'video_id',
        'video_filename',
        'shape_id',
        'shape_name',
        'points',
        'frames',
        'annotation_id',
        'created_at',
    ];

    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertSame('CSV video annotation report', $generator->getName());
        $this->assertSame('csv_video_annotation_report', $generator->getFilename());
        $this->assertStringEndsWith('.zip', $generator->getFullFilename());
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
            'media_type_id' => MediaType::videoId(),
        ]);

        $video = VideoTest::create([
            'volume_id' => $volume->id,
        ]);

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $al = VideoAnnotationLabelTest::create(['label_id' => $child->id]);
        $al->annotation->video_id = $video->id;
        $al->annotation->video->attrs = $video->attrs;
        $al->annotation->save();

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
                $al->id,
                $child->id,
                $child->name,
                "{$root->name} > {$child->name}",
                $al->user_id,
                $al->user->firstname,
                $al->user->lastname,
                $al->annotation->video_id,
                $al->annotation->video->filename,
                $al->annotation->shape->id,
                $al->annotation->shape->name,
                json_encode($al->annotation->points),
                json_encode($al->annotation->frames),
                $al->annotation->id,
                $al->created_at,
                json_encode($video->attrs),
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$volume->id}-my-cool-volume.csv");

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

        $annotation = VideoAnnotationTest::create(['video_id' => $video->id]);

        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'label_id' => $label1->id,
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
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
                $al1->id,
                $label1->id,
                $label1->name,
                $label1->name,
                $al1->user_id,
                $al1->user->firstname,
                $al1->user->lastname,
                $annotation->video_id,
                $annotation->video->filename,
                $annotation->shape->id,
                $annotation->shape->name,
                json_encode($annotation->points),
                json_encode($annotation->frames),
                $annotation->id,
                $al1->created_at,
                json_encode($video->attrs),
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $al2->id,
                $label2->id,
                $label2->name,
                $label2->name,
                $al2->user_id,
                $al2->user->firstname,
                $al2->user->lastname,
                $annotation->video_id,
                $annotation->video->filename,
                $annotation->shape->id,
                $annotation->shape->name,
                json_encode($annotation->points),
                json_encode($annotation->frames),
                $annotation->id,
                $al2->created_at,
                json_encode($video->attrs),
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

        $annotation = VideoAnnotationTest::create(['video_id' => $video->id]);

        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $user1->id,
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
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
                $al1->id,
                $al1->label->id,
                $al1->label->name,
                $al1->label->name,
                $al1->user_id,
                $al1->user->firstname,
                $al1->user->lastname,
                $annotation->video_id,
                $annotation->video->filename,
                $annotation->shape->id,
                $annotation->shape->name,
                json_encode($annotation->points),
                json_encode($annotation->frames),
                $annotation->id,
                $al1->created_at,
                json_encode($video->attrs),
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $al2->id,
                $al2->label->id,
                $al2->label->name,
                $al2->label->name,
                $al2->user_id,
                $al2->user->firstname,
                $al2->user->lastname,
                $annotation->video_id,
                $annotation->video->filename,
                $annotation->shape->id,
                $annotation->shape->name,
                json_encode($annotation->points),
                json_encode($annotation->frames),
                $annotation->id,
                $al2->created_at,
                json_encode($video->attrs),
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
        $annotation = VideoAnnotationTest::create(['video_id' => $video->id]);

        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);

        $generator = new CsvReportGenerator([
            'onlyLabels' => [$al1->label_id],
        ]);
        $generator->setSource($video->volume);
        $results = $generator->initQuery(['video_annotation_labels.id'])->get();
        $this->assertCount(1, $results);
        $this->assertSame($al1->id, $results[0]->id);
    }

    public function testRestrictToAnnotationSessionQuery()
    {
        $user = UserTest::create();

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
        ]);

        $session->users()->attach($user);

        $a1 = VideoAnnotationTest::create([
            'created_at' => '2016-10-04',
        ]);
        $a1->video->volume_id = $session->volume_id;
        $a1->video->save();

        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
        ]);

        $a2 = VideoAnnotationTest::create([
            'video_id' => $a1->video_id,
            'created_at' => '2016-10-05',
        ]);

        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
        ]);

        $al3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
        ]);

        $generator = new CsvReportGenerator([
            'annotationSession' => $session->id,
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery(['video_annotation_labels.id'])->get();
        $this->assertCount(1, $results);
        $this->assertSame($al2->id, $results[0]->id);
    }

    public function testRestrictToNewestLabelQuery()
    {
        $a = VideoAnnotationTest::create();

        $al1 = VideoAnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:15:00',
            'annotation_id' => $a->id,
        ]);

        // Even if there are two labels created in the same second, we only want the
        // newest one (as determined by the ID).
        $al2 = VideoAnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:16:00',
            'annotation_id' => $a->id,
        ]);

        $al3 = VideoAnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:16:00',
            'annotation_id' => $a->id,
        ]);

        $generator = new CsvReportGenerator([
            'newestLabel' => true,
        ]);
        $generator->setSource($a->video->volume);
        $results = $generator->initQuery(['video_annotation_labels.id'])->get();
        $this->assertCount(1, $results);
        $this->assertSame($al3->id, $results[0]->id);
    }

    public function testGenerateReportWithDeletedUser()
    {
        $user = UserTest::create([
            'firstname' => 'Joe Jack',
            'lastname' => 'User',
        ]);

        $video = VideoTest::create();

        $volName = Str::slug($video->volume->name);

        $annotation = VideoAnnotationTest::create(['video_id' => $video->id]);

        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => null // deleted user
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
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
                $al1->id,
                $al1->label->id,
                $al1->label->name,
                $al1->label->name,
                null,
                null,
                null,
                $annotation->video_id,
                $annotation->video->filename,
                $annotation->shape->id,
                $annotation->shape->name,
                json_encode($annotation->points),
                json_encode($annotation->frames),
                $annotation->id,
                $al1->created_at,
                json_encode($video->attrs),
            ]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $al2->id,
                $al2->label->id,
                $al2->label->name,
                $al2->label->name,
                $al2->user_id,
                $al2->user->firstname,
                $al2->user->lastname,
                $annotation->video_id,
                $annotation->video->filename,
                $annotation->shape->id,
                $annotation->shape->name,
                json_encode($annotation->points),
                json_encode($annotation->frames),
                $annotation->id,
                $al2->created_at,
                json_encode($video->attrs),
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

        $generator = new CsvReportGenerator;
        $generator->setSource($video->volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSkipAttributes()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
            'media_type_id' => MediaType::videoId(),
        ]);

        $video = VideoTest::create([
            'volume_id' => $volume->id,
        ]);

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $al = VideoAnnotationLabelTest::create(['label_id' => $child->id]);
        $al->annotation->video_id = $video->id;
        $al->annotation->video->attrs = $video->attrs;
        $al->annotation->save();

        $mock = Mockery::mock();

        $mock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $mock->shouldReceive('putCsv')
            ->once()
            ->with($this->columnsSkipAttributes);

        //Note that here the attribute element is not present
        $mock->shouldReceive('putCsv')
            ->once()
            ->with([
                $al->id,
                $child->id,
                $child->name,
                "{$root->name} > {$child->name}",
                $al->user_id,
                $al->user->firstname,
                $al->user->lastname,
                $al->annotation->video_id,
                $al->annotation->video->filename,
                $al->annotation->shape->id,
                $al->annotation->shape->name,
                json_encode($al->annotation->points),
                json_encode($al->annotation->frames),
                $al->annotation->id,
                $al->created_at,
            ]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, fn () => $mock);

        $mock = Mockery::mock();

        $mock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $mock->shouldReceive('addFile')
            ->once()
            ->with('abc', "{$volume->id}-my-cool-volume.csv");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $mock);

        $generator = new CsvReportGenerator([
            'skipAttributes' => true
        ]);
        $generator->setSource($volume);
        $generator->generateReport('my/path');
    }
}
