<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Videos\VideoAnnotations;

use App;
use Mockery;
use TestCase;
use ZipArchive;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\Modules\Videos\VideoTest;
use Biigle\Modules\Reports\Support\CsvFile;
use Biigle\Modules\Videos\VideosServiceProvider;
use Biigle\Tests\Modules\Videos\VideoAnnotationTest;
use Biigle\Tests\Modules\Videos\VideoAnnotationLabelTest;
use Biigle\Modules\Reports\Support\Reports\Videos\VideoAnnotations\CsvReportGenerator;

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
        'video_name',
        'shape_id',
        'shape_name',
        'points',
        'frames',
    ];

    public function setUp()
    {
        parent::setUp();
        if (!class_exists(VideosServiceProvider::class)) {
            $this->markTestSkipped('Requires the biigle/videos module.');
        }
    }

    public function testProperties()
    {
        $generator = new CsvReportGenerator;
        $this->assertEquals('CSV video annotation report', $generator->getName());
        $this->assertEquals('csv_video_annotation_report', $generator->getFilename());
        $this->assertStringEndsWith('.zip', $generator->getFullFilename());
    }

    public function testGenerateReport()
    {
        $video = VideoTest::create([
            'name' => 'My Cool Video',
        ]);

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $al = VideoAnnotationLabelTest::create(['label_id' => $child->id]);
        $al->annotation->video_id = $video->id;
        $al->annotation->save();

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
                "{$root->name} > {$child->name}",
                $al->user_id,
                $al->user->firstname,
                $al->user->lastname,
                $al->annotation->video_id,
                $al->annotation->video->name,
                $al->annotation->shape->id,
                $al->annotation->shape->name,
                json_encode($al->annotation->points),
                json_encode($al->annotation->frames),
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
            ->with('abc', "{$video->id}-my-cool-video.csv");

        $mock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, function () use ($mock) {
            return $mock;
        });

        $generator = new CsvReportGenerator;
        $generator->setSource($video);
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
            'video_annotation_id' => $annotation->id,
            'label_id' => $label1->id,
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'video_annotation_id' => $annotation->id,
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
                $label1->name,
                $al1->user_id,
                $al1->user->firstname,
                $al1->user->lastname,
                $annotation->video_id,
                $annotation->video->name,
                $annotation->shape->id,
                $annotation->shape->name,
                json_encode($annotation->points),
                json_encode($annotation->frames),
            ]);

        $mock->shouldReceive('put')
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
                $annotation->video->name,
                $annotation->shape->id,
                $annotation->shape->name,
                json_encode($annotation->points),
                json_encode($annotation->frames),
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
        $generator->setSource($video);
        $generator->generateReport('my/path');
    }
}
