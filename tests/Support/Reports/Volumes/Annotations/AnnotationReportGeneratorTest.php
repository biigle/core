<?php

namespace Biigle\Tests\Modules\Export\Support\Reports\Volumes\Annotations;

use TestCase;
use Biigle\Shape;
use Biigle\Annotation;
use Biigle\Tests\UserTest;
use Biigle\AnnotationLabel;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Modules\Export\Volume;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Modules\Export\Support\Reports\Volumes\Annotations\AnnotationReportGenerator;

class AnnotationReportGeneratorTest extends TestCase
{
    public function testRestrictToExportAreaQuery()
    {
        $volume = Volume::convert(VolumeTest::create());

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
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

        $report = new AnnotationReportGenerator($volume);

        $ids = Annotation::when(true, [$report, 'restrictToExportAreaQuery'])->pluck('id')->toArray();
        $ids = array_map('intval', $ids);

        sort($inside);
        sort($ids);

        $this->assertEquals($inside, $ids);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testGetNameAndFilename()
    {
        $session = AnnotationSessionTest::create();

        $report = new AnnotationReportGenerator($session->volume, [
            'exportArea' => true,
        ]);

        $this->assertContains('restricted to export area', $report->getName());
        $this->assertContains('restricted_to_export_area', $report->getFilename());

        $report = new AnnotationReportGenerator($session->volume, [
            'annotationSession' => $session->id,
        ]);

        $this->assertContains('restricted to annotation session', $report->getName());
        $this->assertContains($session->name, $report->getName());
        $this->assertContains('restricted_to_annotation_session', $report->getFilename());

        $report = new AnnotationReportGenerator($session->volume, [
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
        $a->image->volume_id = $session->volume_id;

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

        $report = new AnnotationReportGenerator($session->volume, [
            'annotationSession' => $session->id,
        ]);
        $results = AnnotationLabel::when(true, [$report, 'restrictToAnnotationSessionQuery'])->get();

        $this->assertEquals(1, count($results));
        $this->assertEquals($al2->id, $results[0]->id);
    }
}
