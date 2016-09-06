<?php

use Dias\AnnotationSession;

class AnnotationSessionTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = Dias\AnnotationSession::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->description);
        $this->assertNotNull($this->model->starts_at);
        $this->assertNotNull($this->model->ends_at);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->transect_id);
        $this->assertNotNull($this->model->hide_other_users_annotations);
        $this->assertNotNull($this->model->hide_own_annotations);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testStartsAtRequired()
    {
        $this->model->starts_at = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testEndsAtRequired()
    {
        $this->model->ends_at = null;
        $this->setExpectedException('Illuminate\Database\QueryException');
        $this->model->save();
    }

    public function testTransectOnDeleteCascade()
    {
        $this->model->transect()->delete();
        $this->assertNull($this->model->fresh());
    }

    public function testGetImageAnnotationsHideOwn()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should not be shown
        $a1 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'points' => [10, 20, 30],
        ]);
        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown but the annotation label of the own user should be hidden
        $a2 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'points' => [20, 30, 40],
        ]);
        $al21 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);
        $al22 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown completely
        $a3 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
            'points' => [30, 40, 50],
        ]);
        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'transect_id' => $image->transect->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $annotations = $session->getImageAnnotations($image, $ownUser);
        // expand the models in the collection so we can make assertions
        $annotations = collect($annotations->toArray());

        $this->assertFalse($annotations->contains('points', [10, 20, 30]));
        $this->assertFalse($annotations->contains($al1->load('user', 'label')->toArray()));

        $this->assertTrue($annotations->contains('points', [20, 30, 40]));
        $this->assertFalse($annotations->contains('labels', [$al21->load('user', 'label')->toArray()]));
        $this->assertTrue($annotations->contains('labels', [$al22->load('user', 'label')->toArray()]));

        $this->assertTrue($annotations->contains('points', [30, 40, 50]));
        $this->assertTrue($annotations->contains('labels', [$al3->load('user', 'label')->toArray()]));
    }

    public function testGetImageAnnotationsHideOther()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should not be shown
        $a1 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'points' => [10, 20, 30],
        ]);
        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown but the annotation label of other users should be hidden
        $a2 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'points' => [20, 30, 40],
        ]);
        $al21 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);
        $al22 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown completely
        $a3 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'points' => [30, 40, 50],
        ]);
        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown completely
        $a4 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
            'points' => [40, 50, 60],
        ]);
        $al4 = AnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'transect_id' => $image->transect->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);

        $annotations = $session->getImageAnnotations($image, $ownUser);
        // expand the models in the collection so we can make assertions
        $annotations = collect($annotations->toArray());

        $this->assertFalse($annotations->contains('points', [10, 20, 30]));
        $this->assertFalse($annotations->contains($al1->load('user', 'label')->toArray()));

        $this->assertTrue($annotations->contains('points', [20, 30, 40]));
        $this->assertFalse($annotations->contains('labels', [$al21->load('user', 'label')->toArray()]));
        $this->assertTrue($annotations->contains('labels', [$al22->load('user', 'label')->toArray()]));

        $this->assertTrue($annotations->contains('points', [30, 40, 50]));
        $this->assertTrue($annotations->contains('labels', [$al3->load('user', 'label')->toArray()]));

        $this->assertTrue($annotations->contains('points', [40, 50, 60]));
        $this->assertTrue($annotations->contains('labels', [$al4->load('user', 'label')->toArray()]));
    }

    public function testGetImageAnnotationsHideBoth()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should not be shown
        $a1 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'points' => [10, 20, 30],
        ]);
        $al1 = AnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should not be shown
        $a2 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'points' => [20, 30, 40],
        ]);
        $al21 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);
        $al22 = AnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should not be shown
        $a3 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
            'points' => [30, 40, 50],
        ]);
        $al3 = AnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        // this should be shown completely
        $a4 = AnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
            'points' => [40, 50, 60],
        ]);
        $al4 = AnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'transect_id' => $image->transect->id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $annotations = $session->getImageAnnotations($image, $ownUser);
        // expand the models in the collection so we can make assertions
        $annotations = collect($annotations->toArray());

        $this->assertFalse($annotations->contains('points', [10, 20, 30]));
        $this->assertFalse($annotations->contains($al1->load('user', 'label')->toArray()));

        $this->assertFalse($annotations->contains('points', [20, 30, 40]));
        $this->assertFalse($annotations->contains('labels', [$al21->load('user', 'label')->toArray()]));
        $this->assertFalse($annotations->contains('labels', [$al22->load('user', 'label')->toArray()]));

        $this->assertFalse($annotations->contains('points', [30, 40, 50]));
        $this->assertFalse($annotations->contains('labels', [$al3->load('user', 'label')->toArray()]));

        $this->assertTrue($annotations->contains('points', [40, 50, 60]));
        $this->assertTrue($annotations->contains('labels', [$al4->load('user', 'label')->toArray()]));
    }
}
