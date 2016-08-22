<?php

use Dias\Project;
use Dias\Shape;
use Dias\Modules\Export\Transect;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\Basic;
use Dias\Modules\Export\Jobs\Annotations\GenerateBasicReport;

class ExportModuleJobsAnnotationsGenerateBasicReportTest extends TestCase {

    public function testGenerateReport()
    {
        $project = ProjectTest::create();
        $transect = TransectTest::create();
        $project->transects()->attach($transect);
        $user = UserTest::create();

        $al = AnnotationLabelTest::create();
        $al->annotation->image->transect_id = $transect->id;
        $al->annotation->image->save();
        AnnotationLabelTest::create([
            'annotation_id' => $al->annotation_id,
            'label_id' => $al->label_id,
        ]);

        $al2 = AnnotationLabelTest::create(['annotation_id' => $al->annotation_id]);

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
            ->with([$al->label->name, $al->label->color, 2]);

        $mock->shouldReceive('put')
            ->once()
            ->with([$al2->label->name, $al2->label->color, 1]);

        $mock->shouldReceive('close')
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

        App::singleton(Basic::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->once()
            ->withArgs([
                'export::emails.report',
                [
                    'user' => $user,
                    'type' => 'basic annotation',
                    'project' => $project,
                    'uuid' => 'abc123',
                    'filename' => "biigle_{$project->id}_basic_annotation_report.pdf",
                ],
                Mockery::type('callable')
            ]);


        with(new GenerateBasicReport($project, $user))->generateReport();
    }

    public function testGenerateReportRestrict()
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
                ->with([$a->label->name, $a->label->color, 1]);
        }

        foreach ($outside as $a) {
            $mock->shouldReceive('put')
                ->never()
                ->with([$a->label->name, $a->label->color, 1]);
        }

        $mock->shouldReceive('close')->once();

        App::singleton(CsvFile::class, function () use ($mock) {
            return $mock;
        });

        $mock = Mockery::mock();
        $mock->shouldReceive('generate', 'basename')->once();

        App::singleton(Basic::class, function () use ($mock) {
            return $mock;
        });

        Mail::shouldReceive('send')
            ->once()
            ->withArgs([
                'export::emails.report',
                [
                    'user' => $user,
                    'type' => 'basic annotation',
                    'restricted' => true,
                    'project' => $project,
                    'uuid' => null,
                    'filename' => "biigle_{$project->id}_basic_annotation_restricted_report.pdf",
                ],
                Mockery::type('callable')
            ]);

        with(new GenerateBasicReport($project, $user, true))->generateReport();
    }
}
