<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use Biigle\Services\Reports\Volumes\ImageAnnotations\AnnotationReportGenerator;
use Biigle\Shape;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use TestCase;

class AnnotationReportGeneratorTest extends TestCase
{
    public function testRestrictToExportAreaQuery()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        array_map(function ($a) {
            ImageAnnotationLabelTest::create(['annotation_id' => $a->id]);
        }, $annotations);

        $inside = [$annotations[0]->id, $annotations[1]->id, $annotations[4]->id];
        $outside = [$annotations[2]->id, $annotations[3]->id, $annotations[5]->id];

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
        ]);
        $generator->setSource($volume);

        $ids = $generator->initQuery(['image_annotations.id'])->pluck('id')->toArray();
        $ids = array_map('intval', $ids);

        sort($inside);
        sort($ids);

        $this->assertSame($inside, $ids);

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

        $a1 = ImageAnnotationTest::create([
            'created_at' => '2016-10-04',
        ]);
        $a1->image->volume_id = $session->volume_id;
        $a1->image->save();

        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $a1->image_id,
            'created_at' => '2016-10-05',
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
        ]);

        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
        ]);

        $generator = new AnnotationReportGenerator([
            'annotationSession' => $session->id,
        ]);
        $generator->setSource($session->volume);
        $results = $generator->initQuery(['image_annotation_labels.id'])->get();
        $this->assertCount(1, $results);
        $this->assertSame($al2->id, $results[0]->id);
    }

    public function testRestrictToNewestLabelQuery()
    {
        $a = ImageAnnotationTest::create();

        $al1 = ImageAnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:15:00',
            'annotation_id' => $a->id,
        ]);

        // Even if there are two labels created in the same second, we only want the
        // newest one (as determined by the ID).
        $al2 = ImageAnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:16:00',
            'annotation_id' => $a->id,
        ]);

        $al3 = ImageAnnotationLabelTest::create([
            'created_at' => '2016-10-05 09:16:00',
            'annotation_id' => $a->id,
        ]);

        $generator = new AnnotationReportGenerator([
            'newestLabel' => true,
        ]);
        $generator->setSource($a->image->volume);
        $results = $generator->initQuery(['image_annotation_labels.id'])->get();
        $this->assertCount(1, $results);
        $this->assertSame($al3->id, $results[0]->id);
    }

    public function testRestrictToLabels()
    {
        $a1 = ImageAnnotationTest::create();
        $al1 = ImageAnnotationLabelTest::create(['annotation_id' => $a1->id]);

        $a2 = ImageAnnotationTest::create(['image_id' => $a1->image_id]);
        $al2 = ImageAnnotationLabelTest::create(['annotation_id' => $a2->id]);

        $generator = new AnnotationReportGenerator([
            'onlyLabels' => [$al1->label_id],
        ]);
        $generator->setSource($a1->image->volume);
        $results = $generator->initQuery(['image_annotation_labels.id'])->get();
        $this->assertCount(1, $results);
        $this->assertSame($al1->id, $results[0]->id);
    }

    public function testAnnotationSessionNewestLabelRestrictedLabel()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'newestLabel' => true,
            'onlyLabels' => [$f->al1->label_id, $f->al2->label_id, $f->al4->label_id, $f->al5->label_id]
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery(['image_annotation_labels.id'])->get();
        $this->assertCount(2, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->id, $f->al4->id],
            [$results[0]->id, $results[1]->id]
        );
    }

    public function testAnnotationSessionNewestLabelRestrictedLabelSeparateLabelTrees()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'newestLabel' => true,
            'onlyLabels' => [$f->al1->label_id, $f->al2->label_id, $f->al4->label_id, $f->al5->label_id],
            'separateLabelTrees' => true
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(2, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->label->label_tree_id, $f->al4->label->label_tree_id],
            [$results[0]->label_tree_id, $results[1]->label_tree_id]
        );
    }

    public function testAnnotationSessionNewestLabelRestrictedLabelSeparateUser()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'newestLabel' => true,
            'onlyLabels' => [$f->al1->label_id, $f->al2->label_id, $f->al4->label_id, $f->al5->label_id],
            'separateUsers' => true
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(2, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->user_id, $f->al4->user_id],
            [$results[0]->user_id, $results[1]->user_id]
        );
    }

    public function testAnnotationSessionNewestLabel()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'newestLabel' => true,
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery(['image_annotation_labels.id'])->get();
        $this->assertCount(3, $results);
        $this->assertEqualsCanonicalizing([$f->al2->id, $f->al3->id, $f->al4->id], $results->pluck('id')->all());
    }

    public function testAnnotationSession()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery(['image_annotation_labels.id'])->get();
        $this->assertCount(4, $results);
        $this->assertEqualsCanonicalizing([$f->al1->id, $f->al2->id, $f->al3->id, $f->al4->id], $results->pluck('id')->all());
    }

    public function testAnnotationSessionSeparateLabelTree()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(4, $results);
       
        $this->assertEqualsCanonicalizing(
            [$f->al1->label->label_tree_id,
                $f->al2->label->label_tree_id,
                $f->al3->label->label_tree_id,
                $f->al4->label->label_tree_id],
            $results->pluck('label_tree_id')->all()
        );
    }

    public function testAnnotationSessionNewestLabelSeparateLabelTree()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'newestLabel' => true,
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(3, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->label->label_tree_id, $f->al3->label->label_tree_id, $f->al4->label->label_tree_id],
            $results->pluck('label_tree_id')->all()
        );
    }

    public function testAnnotationSessionSeparateUser()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'separateUsers' => true,
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(4, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al1->user_id, $f->al2->user_id, $f->al3->user_id, $f->al4->user_id],
            $results->pluck('user_id')->all()
        );
    }

    public function testAnnotationSessionNewestLabelSeparateUser()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'newestLabel' => true,
            'separateUsers' => true,
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(3, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->user_id, $f->al3->user_id, $f->al4->user_id],
            $results->pluck('user_id')->all()
        );
    }

    public function testAnnotationSessionRestrictedLabel()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'onlyLabels' => [$f->al1->label_id, $f->al2->label_id, $f->al4->label_id, $f->al5->label_id]
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery(['image_annotation_labels.id'])->get();
        $this->assertCount(3, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al1->id, $f->al2->id, $f->al4->id],
            $results->pluck('id')->all()
        );
    }

    public function testAnnotationSessionRestrictedLabelSeparateLabelTrees()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'onlyLabels' => [$f->al1->label_id, $f->al2->label_id, $f->al4->label_id, $f->al5->label_id],
            'separateLabelTrees' => true,
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(3, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al1->label->label_tree_id, $f->al2->label->label_tree_id, $f->al4->label->label_tree_id],
            $results->pluck('label_tree_id')->all()
        );
    }

    public function testAnnotationSessionRestrictedLabelSeparateUser()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'annotationSession' => $f->session->id,
            'onlyLabels' => [$f->al1->label_id, $f->al2->label_id, $f->al4->label_id, $f->al5->label_id],
            'separateUsers' => true,
        ]);
        $generator->setSource($f->session->volume);
        $results = $generator->initQuery([])->get();
        $this->assertCount(3, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al1->user_id, $f->al2->user_id, $f->al4->user_id],
            $results->pluck('user_id')->all()
        );
    }

    public function testNewestLabelRestrictedLabel()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'newestLabel' => true,
            'onlyLabels' => [$f->al1->label_id, $f->al2->label_id, $f->al4->label_id]
        ]);
        $generator->setSource($f->volume);
        $results = $generator->initQuery(['image_annotation_labels.id'])->get();
        $this->assertCount(2, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->id, $f->al4->id],
            $results->pluck('id')->all()
        );
    }

    public function testNewestLabelSeparateLabelTree()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'newestLabel' => true,
            'separateLabelTrees' => true
        ]);
        $generator->setSource($f->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(4, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->label->label_tree_id,
                $f->al3->label->label_tree_id,
                $f->al4->label->label_tree_id,
                $f->al5->label->label_tree_id],
            $results->pluck('label_tree_id')->all()
        );
    }

    public function testNewestLabelRestrictedLabelSeparateLabelTrees()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'newestLabel' => true,
            'onlyLabels' => [$f->al1->label_id, $f->al2->label_id, $f->al4->label_id],
            'separateLabelTrees' => true
        ]);
        $generator->setSource($f->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(2, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->label->label_tree_id, $f->al4->label->label_tree_id],
            $results->pluck('label_tree_id')->all()
        );
    }

    public function testNewestLabelSeparateUser()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'newestLabel' => true,
            'separateUsers' => true
        ]);
        $generator->setSource($f->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(4, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->user_id, $f->al3->user_id, $f->al4->user_id, $f->al5->user_id],
            $results->pluck('user_id')->all()
        );
    }

    public function testNewestLabelRestrictedLabelSeparateUser()
    {
        $f = $this->annotationLabelFixture();
        $generator = new AnnotationReportGenerator([
            'newestLabel' => true,
            'onlyLabels' => [$f->al1->label_id, $f->al2->label_id, $f->al4->label_id],
            'separateUsers' => true
        ]);
        $generator->setSource($f->volume);
        $results = $generator->initQuery()->get();
        $this->assertCount(2, $results);
        $this->assertEqualsCanonicalizing(
            [$f->al2->user_id, $f->al4->user_id],
            $results->pluck('user_id')->all()
        );
    }

    public function testRestrictToExportAreaQueryAnnotationSession()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $user = UserTest::create();
        $session->users()->attach($user);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            // created before annotation session started
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
                'created_at' => '2016-10-04',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
        ];

        array_map(function ($a) use ($user) {
            ImageAnnotationLabelTest::create([
                'annotation_id' => $a->id,
                'user_id' => $user->id,
            ]);
        }, $annotations);

        $inside = [$annotations[0]->id, $annotations[4]->id];
        $outside = [$annotations[1]->id, $annotations[2]->id, $annotations[3]->id, $annotations[5]->id];

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
            'annotationSession' => $session->id
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotations.id as annotation_id'])->get();
        $ids = $res->pluck('annotation_id')->toArray();
        $ids = array_map('intval', $ids);

        sort($inside);
        sort($ids);

        $this->assertSame($inside, $ids);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testRestrictToExportAreaQueryAnnotationSessionRestrictToNewestLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $user = UserTest::create();
        $session->users()->attach($user);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            // created before annotation session started
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
                'created_at' => '2016-10-04',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
        ];

        $labels = array_map(fn ($a) => ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $user->id,
        ]), $annotations);

        $newestLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotations[0]->id,
            'user_id' => $user->id,
            'created_at' => '2025-10-5',
        ]);

        $inside = [$newestLabel->label_id, $labels[4]->label_id];
        $outside = [$labels[0]->label_id, $labels[1]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
            'annotationSession' => $session->id,
            'newestLabel' => true
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);

        sort($inside);
        sort($ids);

        $this->assertSame($inside, $ids);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testRestrictToExportAreaQueryAnnotationSessionRestrictToLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $user = UserTest::create();
        $session->users()->attach($user);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            // created before annotation session started
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
                'created_at' => '2016-10-04',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
        ];

        $labels = array_map(fn ($a) => ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $user->id,
        ]), $annotations);

        $inside = [$labels[0]->label_id, $labels[4]->label_id];
        $outside = [$labels[1]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
            'annotationSession' => $session->id,
            'onlyLabels' => [$labels[0]->label_id, $labels[1]->label_id, $labels[4]->label_id]
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);

        sort($inside);
        sort($ids);

        $this->assertSame($inside, $ids);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testRestrictToExportAreaQueryRestrictToNewestLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        $labels = array_map(fn ($a) => ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]), $annotations);

        $newestLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotations[0]->id,
            'created_at' => '2025-10-5',
        ]);


        $inside = [$newestLabel->label_id, $labels[1]->label_id, $labels[4]->label_id];
        $outside = [$labels[0]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
            'newestLabel' => true
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);

        sort($inside);
        sort($ids);

        $this->assertSame($inside, $ids);

        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testRestrictToExportAreaQueryRestrictToNewestLabelsRestrictToLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        $labels = array_map(fn ($a) => ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]), $annotations);

        $newestLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotations[0]->id,
            'created_at' => '2025-10-5',
        ]);

        $inside = [$newestLabel->label_id, $labels[1]->label_id];
        $outside = [$labels[0]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[4]->label_id, $labels[5]->label_id];

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
            'newestLabel' => true,
            'onlyLabels' => [$newestLabel->label_id, $labels[1]->label_id]
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);


        sort($inside);
        sort($ids);

        $this->assertSame($inside, $ids);


        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testRestrictToExportAreaQueryRestrictToLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
            ]),
        ];

        $labels = array_map(fn ($a) => ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
        ]), $annotations);

        $inside = [$labels[1]->label_id, $labels[4]->label_id];
        $outside = [$labels[0]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
            'onlyLabels' => [$labels[1]->label_id, $labels[4]->label_id]
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);


        sort($inside);
        sort($ids);

        $this->assertSame($inside, $ids);


        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }

    public function testRestrictToExportAreaQueryAnnotationSessionRestrictToNewestLabelsRestrictToLabels()
    {
        $volume = VolumeTest::create();

        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => '1.jpg',
        ]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume,
        ]);

        $user = UserTest::create();
        $session->users()->attach($user);

        $annotations = [
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [150, 150],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            // created before annotation session started
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 150, 150, 90, 90],
                'image_id' => $image->id,
                'created_at' => '2016-10-04',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::pointId(),
                'points' => [50, 50],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::polygonId(),
                'points' => [50, 50, 10, 10, 25, 25],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [150, 150, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
            ImageAnnotationTest::create([
                'shape_id' => Shape::circleId(),
                'points' => [50, 50, 10],
                'image_id' => $image->id,
                'created_at' => '2016-10-05',
            ]),
        ];

        $labels = array_map(fn ($a) => ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $user->id
        ]), $annotations);

        $newestLabel = ImageAnnotationLabelTest::create([
            'annotation_id' => $annotations[0]->id,
            'created_at' => '2025-10-5',
            'user_id' => $user->id
        ]);


        $inside = [$newestLabel->label_id, $labels[4]->label_id];
        $outside = [$labels[0]->label_id, $labels[1]->label_id, $labels[2]->label_id, $labels[3]->label_id, $labels[5]->label_id];

        $generator = new AnnotationReportGenerator([
            'exportArea' => true,
            'annotationSession' => $session->id,
            'onlyLabels' => [$labels[0]->label_id, $newestLabel->label_id, $labels[1]->label_id, $labels[4]->label_id],
            'newestLabel' => true
        ]);
        $generator->setSource($volume);

        $res = $generator->initQuery(['images.id', 'image_annotation_labels.label_id'])->get();
        $ids = $res->pluck('label_id')->toArray();
        $ids = array_map('intval', $ids);

        sort($inside);
        sort($ids);

        $this->assertSame($inside, $ids);


        foreach ($outside as $id) {
            $this->assertNotContains($id, $ids);
        }
    }
    
    private function annotationLabelFixture(): object
    {
        $volume = VolumeTest::create();
        $userId = $volume->creator_id;
        $image = ImageTest::create(['volume_id' => $volume->id]);

        $session = AnnotationSessionTest::create([
            'starts_at' => '2016-10-05',
            'ends_at' => '2016-10-06',
            'volume_id' => $volume->id
        ]);

        $session->users()->attach($userId);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-10-05 09:15:00',
        ]);

        // Annotation label inside of the session window
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $userId,
        ]);

        // Even if there are two labels created in the same second, we only want the
        // newest one (as determined by the ID).
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $userId,
        ]);

        // These 2 annotation labels are also inside the session window, but belong to different annotations
        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-05 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);

        // Annotation label outside of the session window
        $al5 = ImageAnnotationLabelTest::create([
            'annotation_id' => ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => '2016-10-04 09:15:00',
            ])->id,
            'user_id' => $userId,
        ]);
        
        return (object) compact('volume', 'session', 'userId', 'image', 'a', 'al1', 'al2', 'al3', 'al4', 'al5');
    }
}
