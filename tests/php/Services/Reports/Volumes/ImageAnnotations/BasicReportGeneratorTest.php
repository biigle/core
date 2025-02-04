<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\Volumes\ImageAnnotations\BasicReportGenerator;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Mockery;
use TestCase;

class BasicReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new BasicReportGenerator;
        $this->assertSame('basic image annotation report', $generator->getName());
        $this->assertSame('basic_image_annotation_report', $generator->getFilename());
        $this->assertStringEndsWith('.pdf', $generator->getFullFilename());
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create();

        $al = ImageAnnotationLabelTest::create();
        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->save();
        ImageAnnotationLabelTest::create([
            'annotation_id' => $al->annotation_id,
            'label_id' => $al->label_id,
        ]);

        $al2 = ImageAnnotationLabelTest::create(['annotation_id' => $al->annotation_id]);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with('');

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$al->label->name, $al->label->color, 2]);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$al2->label->name, $al2->label->color, 1]);

        $mock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, fn () => $mock);

        $generator = new BasicReportGenerator;
        $generator->setSource($volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportSeparateLabelTrees()
    {
        // have different label trees
        $label1 = LabelTest::create();
        $label2 = LabelTest::create();

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

        $mock->shouldReceive('put')
            ->once()
            ->with($label1->tree->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$label1->name, $label1->color, 1]);

        $mock->shouldReceive('put')
            ->once()
            ->with($label2->tree->name);

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$label2->name, $label2->color, 1]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, fn () => $mock);

        $mock = Mockery::mock();
        $mock->code = 0;
        App::singleton(Exec::class, fn () => $mock);

        $generator = new BasicReportGenerator([
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
        $image = ImageTest::create();

        $annotation = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
        ]);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with("{$al1->user->firstname} {$al1->user->lastname}");

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$al1->label->name, $al1->label->color, 1]);

        $mock->shouldReceive('put')
            ->once()
            ->with("{$al2->user->firstname} {$al2->user->lastname}");

        $mock->shouldReceive('putCsv')
            ->once()
            ->with([$al2->label->name, $al2->label->color, 1]);

        $mock->shouldReceive('close')
            ->twice();

        App::singleton(CsvFile::class, fn () => $mock);

        $mock = Mockery::mock();
        $mock->code = 0;
        App::singleton(Exec::class, fn () => $mock);

        $generator = new BasicReportGenerator([
            'separateUsers' => true,
        ]);
        $generator->setSource($image->volume);
        $mock = Mockery::mock();
        $mock->shouldReceive('run')->once();
        $generator->setPythonScriptRunner($mock);
        $generator->generateReport('my/path');
    }
}
