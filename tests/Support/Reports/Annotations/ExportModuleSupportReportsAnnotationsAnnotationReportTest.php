<?php

use Dias\Shape;
use Dias\Modules\Export\Transect;
use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Annotations\BasicReport;

class ExportModuleSupportReportsAnnotationsAnnotationReportTest extends TestCase
{

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
        $mock->path = 'abc';
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
        $mock->code = 0;
        App::singleton(Exec::class, function () use ($mock) {
            return $mock;
        });

        with(new BasicReport($project, true))->generateReport();
    }
}
