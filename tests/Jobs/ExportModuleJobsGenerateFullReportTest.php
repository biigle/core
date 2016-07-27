<?php

use Dias\Shape;
use Dias\Project;
use Dias\Modules\Export\Transect;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Full;
use Dias\Modules\Export\Jobs\GenerateFullReport;

class ExportModuleJobsGenerateFullReportTest extends TestCase {

    public function testHandle()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->save();

        // check if the temporary file exists
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->with([$transect->name]);

        $mock->shouldReceive('put')
            ->once()
            ->with([
                $al->annotation->image->filename,
                $al->annotation_id,
                $al->label->name,
                $al->annotation->shape->name,
                json_encode($al->annotation->points),
            ]);

        $mock->shouldReceive('delete', 'close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('generate')
            ->once()
            ->with(Mockery::type(Project::class), Mockery::type('array'));

        $mock->shouldReceive('basename')
            ->once()
            ->andReturn('abc123');

        App::singleton(Full::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->once()
            ->withArgs([
                'export::emails.report',
                [
                    'user' => $user,
                    'type' => 'full',
                    'project' => $project,
                    'uuid' => 'abc123',
                    'restricted' => false,
                    'filename' => "biigle_{$project->id}_full_report.xlsx",
                ],
                Mockery::type('callable')
            ]);


        with(new GenerateFullReport($project, $user))->handle();
    }

    public function testHandleRestrict()
    {
        $project = ProjectTest::create();
        $transect = Transect::convert(TransectTest::create());
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $transect->exportArea = [100, 100, 200, 200];
        $transect->save();

        $image = ImageTest::create([
            'transect_id' => $transect->id,
            'filename' => '1.jpg',
        ]);

        $annotations = [
            AnnotationTest::create([
                'shape_id' => Shape::$pointId,
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::$polygonId,
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::$pointId,
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::$polygonId,
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::$circleId,
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::$circleId,
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        $inside = [
            AnnotationLabelTest::create(['annotation_id' => $annotations[0]->id]),
            AnnotationLabelTest::create(['annotation_id' => $annotations[1]->id]),
            AnnotationLabelTest::create(['annotation_id' => $annotations[4]->id]),
        ];

        $outside = [
            AnnotationLabelTest::create(['annotation_id' => $annotations[2]->id]),
            AnnotationLabelTest::create(['annotation_id' => $annotations[3]->id]),
            AnnotationLabelTest::create(['annotation_id' => $annotations[5]->id]),
        ];

        $mock = Mockery::mock();
        $mock->shouldReceive('put')
            ->once()
            ->with([$transect->name]);

        foreach ($inside as $a) {
            $mock->shouldReceive('put')
                ->once()
                ->with([$image->filename, $a->annotation_id, $a->label->name, $a->annotation->shape->name, json_encode($a->annotation->points)]);
        }

        foreach ($outside as $a) {
            $mock->shouldReceive('put')
                ->never()
                ->with([$image->filename, $a->annotation_id, $a->label->name, $a->annotation->shape->name, json_encode($a->annotation->points)]);
        }

        $mock->shouldReceive('delete', 'close')->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();
        $mock->shouldReceive('generate', 'basename')->once();

        App::singleton(Full::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')->once();

        with(new GenerateFullReport($project, $user, true))->handle();
    }

    public function testHandleExceptionCsv()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->save();

        // check if the temporary file exists
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->once()
            ->andThrow('Exception');

        $mock->shouldReceive('delete')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('generate')
            ->never();

        App::singleton(Full::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->never();

        with(new GenerateFullReport($project, $user))->handle();
    }

    public function testHandleExceptionReport()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->save();

        // check if the temporary file exists
        File::shouldReceive('exists')
            ->once()
            ->andReturn(false);

        $mock = Mockery::mock();

        $mock->shouldReceive('put')
            ->twice();

        $mock->shouldReceive('delete', 'close')
            ->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();

        $mock->shouldReceive('generate')
            ->once()
            ->andThrow('Exception');

        $mock->shouldReceive('delete')
            ->once();

        App::singleton(Full::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->never();

        $this->setExpectedException('Exception');
        with(new GenerateFullReport($project, $user))->handle();
    }
}
