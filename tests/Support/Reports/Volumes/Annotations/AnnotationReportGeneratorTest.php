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

        $generator = new AnnotationReportGenerator;
        $generator->setSource($volume);

        $ids = Annotation::when(true, [$generator, 'restrictToExportAreaQuery'])->pluck('id')->toArray();
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

        $this->assertContains('restricted to export area', $generator->getName());
        $this->assertContains('restricted_to_export_area', $generator->getFilename());

        $generator = new AnnotationReportGenerator([
            'annotationSession' => $session->id,
        ]);

        $this->assertContains('restricted to annotation session', $generator->getName());
        $this->assertContains($session->name, $generator->getName());
        $this->assertContains('restricted_to_annotation_session', $generator->getFilename());

        $generator = new AnnotationReportGenerator([
            'newestLabel' => true,
        ]);

        $this->assertContains('restricted to newest label of each annotation', $generator->getName());
        $this->assertContains('restricted_to_newest_label', $generator->getFilename());

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
            'newestLabel' => true,
            'annotationSession' => $session->id,
        ]);

        $this->assertContains('export area', $generator->getName());
        $this->assertContains('export_area', $generator->getFilename());
        $this->assertContains('newest label', $generator->getName());
        $this->assertContains('newest_label', $generator->getFilename());
        $this->assertContains('annotation session', $generator->getName());
        $this->assertContains($session->name, $generator->getName());
        $this->assertContains('annotation_session', $generator->getFilename());

        $session->delete();

        $generator = new AnnotationReportGenerator([
            'annotationSession' => $session->id,
        ]);

        $this->assertContains('annotation session', $generator->getName());
        $this->assertNotContains($session->name, $generator->getName());
        $this->assertContains("{$session->id}", $generator->getName());
        $this->assertContains('annotation_session', $generator->getFilename());
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

        $generator = new AnnotationReportGenerator([
            'annotationSession' => $session->id,
        ]);
        $generator->setSource($session->volume);
        $results = AnnotationLabel::when(true, [$generator, 'restrictToAnnotationSessionQuery'])->get();

        $this->assertEquals(1, count($results));
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
        $results = AnnotationLabel::when(true, [$generator, 'restrictToNewestLabelQuery'])->get();

        $this->assertEquals(1, count($results));
        $this->assertEquals($al3->id, $results[0]->id);
    }
}
