<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes\Annotations;

use TestCase;
use Biigle\Shape;
use Biigle\Annotation;
use Biigle\Tests\UserTest;
use Biigle\AnnotationLabel;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\AnnotationTest;
use Biigle\Modules\Reports\Volume;
use Biigle\Tests\AnnotationLabelTest;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Modules\Reports\Support\Reports\Volumes\Annotations\AnnotationReportGenerator;

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
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            AnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        array_map(function ($a) {
            AnnotationLabelTest::create(['annotation_id' => $a->id]);
        }, $annotations);

        $inside = [$annotations[0]->id, $annotations[1]->id, $annotations[4]->id];
        $outside = [$annotations[2]->id, $annotations[3]->id, $annotations[5]->id];

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
        ]);
        $generator->setSource($volume);

        $ids = $generator->initQuery(['annotations.id'])->pluck('id')->toArray();
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

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
        ]);

        $this->assertStringContainsString('restricted to export area', $generator->getName());
        $this->assertStringContainsString('restricted_to_export_area', $generator->getFilename());

        $generator = new AnnotationReportGenerator([
            'annotationSession' => $session->id,
        ]);

        $this->assertStringContainsString('restricted to annotation session', $generator->getName());
        $this->assertStringContainsString($session->name, $generator->getName());
        $this->assertStringContainsString('restricted_to_annotation_session', $generator->getFilename());

        $generator = new AnnotationReportGenerator([
            'newestLabel' => true,
        ]);

        $this->assertStringContainsString('restricted to newest label of each annotation', $generator->getName());
        $this->assertStringContainsString('restricted_to_newest_label', $generator->getFilename());

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
            'newestLabel' => true,
            'annotationSession' => $session->id,
        ]);

        $this->assertStringContainsString('export area', $generator->getName());
        $this->assertStringContainsString('export_area', $generator->getFilename());
        $this->assertStringContainsString('newest label', $generator->getName());
        $this->assertStringContainsString('newest_label', $generator->getFilename());
        $this->assertStringContainsString('annotation session', $generator->getName());
        $this->assertStringContainsString($session->name, $generator->getName());
        $this->assertStringContainsString('annotation_session', $generator->getFilename());

        $session->delete();

        $generator = new AnnotationReportGenerator([
            'annotationSession' => $session->id,
        ]);

        $this->assertStringContainsString('annotation session', $generator->getName());
        $this->assertStringNotContainsString($session->name, $generator->getName());
        $this->assertStringContainsString("{$session->id}", $generator->getName());
        $this->assertStringContainsString('annotation_session', $generator->getFilename());
    }

    public function testRestrictToAnnotationSessionQuery()
    {
        $user = UserTest::create();

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
        ]);

        $session->users()->attach($user);

        $a1 = AnnotationTest::create([
            'created_at' => '2016-10-04',
        ]);
        $a1->image->volume_id = $session->volume_id;
        $a1->image->save();

        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
        ]);

        $a2 = AnnotationTest::create([
            'image_id' => $a1->image_id,
            'created_at' => '2016-10-05',
        ]);

        $al2 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
        ]);

        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
        ]);

        $generator = new AnnotationReportGenerator([
            'annotationSession' => $session->id,
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery(['annotation_labels.id'])->get();
        $this->assertCount(1, $results);
        $this->assertEquals($al2->id, $results[0]->id);
    }

    public function testRestrictToNewestLabelQuery()
    {
        $a = AnnotationTest::create();

        $al1 = AnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:15:00',
            'annotation_id' => $a->id,
        ]);

        // Even if there are two labels created in the same second, we only want the
        // newest one (as determined by the ID).
        $al2 = AnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:16:00',
            'annotation_id' => $a->id,
        ]);

        $al3 = AnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:16:00',
            'annotation_id' => $a->id,
        ]);

        $generator = new AnnotationReportGenerator([
            'newestLabel' => true,
        ]);
        $generator->setSource($a->image->volume);
        $results = $generator->initQuery(['annotation_labels.id'])->get();
        $this->assertCount(1, $results);
        $this->assertEquals($al3->id, $results[0]->id);
    }

    public function testRestrictToLabels()
    {
        $a1 = AnnotationTest::create();
        $al1 = AnnotationLabelTest::create(['annotation_id' => $a1->id]);

        $a2 = AnnotationTest::create(['image_id' => $a1->image_id]);
        $al2 = AnnotationLabelTest::create(['annotation_id' => $a2->id]);

        $generator = new AnnotationReportGenerator([
            'onlyLabels' => [$al1->label_id],
        ]);
        $generator->setSource($a1->image->volume);
        $results = $generator->initQuery(['annotation_labels.id'])->get();
        $this->assertCount(1, $results);
        $this->assertEquals($al1->id, $results[0]->id);
    }
}
