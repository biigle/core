<?php

namespace Dias\Tests\Modules\Export\Support\Reports\Transects\Annotations;

use App;
use File;
use Mockery;
use TestCase;
use Dias\Shape;
use Dias\Annotation;
use Dias\Tests\UserTest;
use Dias\AnnotationLabel;
use Dias\Tests\ImageTest;
use Dias\Tests\TransectTest;
use Dias\Tests\AnnotationTest;
use Dias\Modules\Export\Transect;
use Dias\Tests\AnnotationLabelTest;
use Dias\Tests\AnnotationSessionTest;
use Dias\Modules\Export\Support\Exec;
use Dias\Modules\Export\Support\CsvFile;
use Dias\Modules\Export\Support\Reports\Transects\Annotations\Report;

class ReportTest extends TestCase
{
    public function testRestrictToExportAreaQuery()
    {
        $transect = Transect::convert(TransectTest::create());

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

        $inside = [$annotations[0]->id, $annotations[1]->id, $annotations[4]->id];
        $outside = [$annotations[2]->id, $annotations[3]->id, $annotations[5]->id];

        $report = new Report($transect);

        $ids = Annotation::when(true, [$report, 'restrictToExportAreaQuery'])->pluck('id')->toArray();
        $ids = array_map('intval', $ids);

        sort($inside);
        sort($ids);

        $this->assertEquals($inside, $ids);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testGetName()
    {
        $session = AnnotationSessionTest::create();

        $report = new Report($session->transect, [
            'exportArea' => true,
        ]);

        $this->assertContains('restricted to export area', $report->getName());
        $this->assertContains('restricted_to_export_area', $report->getFilename());

        $report = new Report($session->transect, [
            'annotationSession' => $session->id,
        ]);

        $this->assertContains('restricted to annotation session', $report->getName());
        $this->assertContains($session->name, $report->getName());
        $this->assertContains('restricted_to_annotation_session', $report->getFilename());

        $report = new Report($session->transect, [
            'exportArea' => true,
            'annotationSession' => $session->id,
        ]);

        $this->assertContains('export area', $report->getName());
        $this->assertContains('export_area', $report->getFilename());
        $this->assertContains('annotation session', $report->getName());
        $this->assertContains($session->name, $report->getName());
        $this->assertContains('annotation_session', $report->getFilename());
    }

    public function testRestrictToAnnotationSessionQuery()
    {
        $user = UserTest::create();

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
        ]);

        $session->users()->attach($user);

        $a = AnnotationTest::create();
        $a->image->transect_id = $session->transect_id;

        $al1 = AnnotationLabelTest::create([
            'created_at' => '2016-10-04',
            'annotation_id' => $a->id,
            'user_id' => $user->id,
        ]);

        $al2 = AnnotationLabelTest::create([
            'created_at' => '2016-10-05',
            'annotation_id' => $a->id,
            'user_id' => $user->id,
        ]);

        $al3 = AnnotationLabelTest::create([
            'created_at' => '2016-10-05',
            'annotation_id' => $a->id,
        ]);

        $report = new Report($session->transect, ['annotationSession' => $session->id]);
        $results = AnnotationLabel::when(true, [$report, 'restrictToAnnotationSessionQuery'])->get();

        $this->assertEquals(1, count($results));
        $this->assertEquals($al2->id, $results[0]->id);
    }
}
