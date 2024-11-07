<?php

namespace Biigle\Tests;

use Carbon\Carbon;
use ModelTestCase;
use Biigle\MediaType;
use Biigle\AnnotationSession;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;

class AnnotationSessionTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = AnnotationSession::class;

    public function testAttributes()
    {
        $this->assertNotNull($this->model->name);
        $this->assertNotNull($this->model->description);
        $this->assertNotNull($this->model->starts_at);
        $this->assertNotNull($this->model->ends_at);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNotNull($this->model->volume_id);
        $this->assertNotNull($this->model->hide_other_users_annotations);
        $this->assertNotNull($this->model->hide_own_annotations);
    }

    public function testNameRequired()
    {
        $this->model->name = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testStartsAtRequired()
    {
        $this->model->starts_at = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testEndsAtRequired()
    {
        $this->model->ends_at = null;
        $this->expectException(QueryException::class);
        $this->model->save();
    }

    public function testVolumeOnDeleteCascade()
    {
        $this->model->volume()->delete();
        $this->assertNull($this->model->fresh());
    }

    public function testUsers()
    {
        $user = UserTest::create();
        $this->model->users()->attach($user);
        $sessionUser = $this->model->users()->first();
        $this->assertSame([
            'id' => $user->id,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'email' => $user->email,
        ], $sessionUser->toArray());

        $user->delete();
        $this->assertEmpty($this->model->users()->get());
    }

    public function testGetVolumeFileAnnotationsHideOwnImage()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should be shown but the annotation label of the own user should be hidden
        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'points' => [20, 30, 40],
        ]);
        $al11 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);
        $al12 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $otherUser->id,
            'created_at' => '2022-09-05',
        ]);

        // this should be shown completely
        $a2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
            'points' => [30, 40, 50],
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'volume_id' => $image->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $yieldAnnotations = $session->getVolumeFileAnnotations($image, $ownUser);
        // expand the models in the collection so we can make assertions
        $annotations = collect($yieldAnnotations());
        $labels = $annotations->pluck('labels');

        $this->assertFalse($this->isPresent($al11, $labels));
        $this->assertTrue($this->isPresent($al12, $labels));

        $this->assertTrue($annotations->contains('points', [30, 40, 50]));
        $this->assertTrue($this->isPresent($al2, $labels));
    }

    public function testGetVolumeFileAnnotationsHideOwnVideo()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $video = VideoTest::create();

        // this should be shown but the annotation label of the own user should be hidden
        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
            'points' => [[20, 30, 40]],
        ]);
        $al11 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);
        $al12 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        // this should be shown completely
        $a2 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
            'points' => [[30, 40, 50]],
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'volume_id' => $video->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);

        $yieldAnnotations = $session->getVolumeFileAnnotations($video, $ownUser);
        // expand the models in the collection so we can make assertions
       $annotations = collect($yieldAnnotations());
        $labels = $annotations->pluck('labels');
        
        $this->assertFalse($this->isPresent($al11, $labels));
        $this->assertTrue($this->isPresent($al12, $labels));

        $this->assertTrue($annotations->contains('points', [[30, 40, 50]]));
        $this->assertTrue($this->isPresent($al2, $labels));
    }

    public function testGetVolumeFileAnnotationsHideOtherImage()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should be shown but the annotation label of other users should be hidden
        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
            'points' => [20, 30, 40],
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        $session = static::create([
            'volume_id' => $image->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);

        $yieldAnnotations = $session->getVolumeFileAnnotations($image, $ownUser);;
        // expand the models in the collection so we can make assertions
       $annotations = collect($yieldAnnotations());
        $labels = $annotations->pluck('labels');

        $this->assertTrue($annotations->contains('points', [20, 30, 40]));
        $this->assertFalse($this->isPresent($al1, $labels));
        $this->assertTrue($this->isPresent($al2, $labels));
    }

    public function testGetVolumeFileAnnotationsHideOtherVideo()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $video = VideoTest::create();

        // this should be shown but the annotation label of other users should be hidden
        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
            'points' => [[20, 30, 40]],
        ]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        $session = static::create([
            'volume_id' => $video->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => true,
        ]);

        $yieldAnnotations = $session->getVolumeFileAnnotations($video, $ownUser);;
        // expand the models in the collection so we can make assertions
       $annotations = collect($yieldAnnotations());
        $labels = $annotations->pluck('labels');

        $this->assertTrue($annotations->contains('points', [[20, 30, 40]]));
        $this->assertFalse($this->isPresent($al1, $labels));
        $this->assertTrue($this->isPresent($al2, $labels));
    }

    public function testGetVolumeFileAnnotationsHideBothImage()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        // this should be shown but the annotation label of other users should be hidden
        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
            'points' => [40, 50, 60],
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'volume_id' => $image->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $yieldAnnotations = $session->getVolumeFileAnnotations($image, $ownUser);;
        // expand the models in the collection so we can make assertions
       $annotations = collect($yieldAnnotations());
        $labels = $annotations->pluck('labels');

        $this->assertTrue($annotations->contains('points', [40, 50, 60]));
        $this->assertTrue($this->isPresent($al1, $labels));
        $this->assertFalse($this->isPresent($al2, $labels));
    }

    public function testGetVolumeFileAnnotationsHideBothVideo()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $video = VideoTest::create();

        // this should be shown but the annotation label of other users should be hidden
        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
            'points' => [[40, 50, 60]],
        ]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'volume_id' => $video->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);

        $yieldAnnotations = $session->getVolumeFileAnnotations($video, $ownUser);;
        // expand the models in the collection so we can make assertions
       $annotations = collect($yieldAnnotations());
        $labels = $annotations->pluck('labels');

        $this->assertTrue($annotations->contains('points', [[40, 50, 60]]));
        $this->assertTrue($this->isPresent($al1, $labels));
        $this->assertFalse($this->isPresent($al2, $labels));
    }

    public function testGetVolumeFileAnnotationsHideNothingImage()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
            'points' => [40, 50, 60],
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'volume_id' => $image->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => false,
        ]);

        $yieldAnnotations = $session->getVolumeFileAnnotations($image, $ownUser);
        // expand the models in the collection so we can make assertions
       $annotations = collect($yieldAnnotations());
        $labels = $annotations->pluck('labels');

        $this->assertTrue($annotations->contains('points', [40, 50, 60]));
        $this->assertTrue($this->isPresent($al1, $labels));
        $this->assertTrue($this->isPresent($al2, $labels));
    }

    public function testGetVolumeFileAnnotationsHideNothingVideo()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $video = VideoTest::create();

        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
            'points' => [[40, 50, 60]],
        ]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'volume_id' => $video->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => false,
        ]);

        $yieldAnnotations = $session->getVolumeFileAnnotations($video, $ownUser);;
        // expand the models in the collection so we can make assertions
       $annotations = collect($yieldAnnotations());
        $labels = $annotations->pluck('labels');

        $this->assertTrue($annotations->contains('points', [[40, 50, 60]]));
        $this->assertTrue($this->isPresent($al1, $labels));
        $this->assertTrue($this->isPresent($al2, $labels));
    }

    public function testAllowsAccessImageAnnotation()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        $a3 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $a4 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::make([
            'volume_id' => $image->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => false,
        ]);

        $this->assertTrue($session->allowsAccess($a1, $ownUser));
        $this->assertTrue($session->allowsAccess($a2, $ownUser));
        $this->assertTrue($session->allowsAccess($a3, $ownUser));
        $this->assertTrue($session->allowsAccess($a4, $ownUser));

        $session->hide_own_annotations = true;

        $this->assertFalse($session->allowsAccess($a1, $ownUser));
        $this->assertTrue($session->allowsAccess($a2, $ownUser));
        $this->assertTrue($session->allowsAccess($a3, $ownUser));
        $this->assertTrue($session->allowsAccess($a4, $ownUser));

        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;

        $this->assertTrue($session->allowsAccess($a1, $ownUser));
        $this->assertFalse($session->allowsAccess($a2, $ownUser));
        $this->assertTrue($session->allowsAccess($a3, $ownUser));
        $this->assertFalse($session->allowsAccess($a4, $ownUser));

        $session->hide_own_annotations = true;

        $this->assertFalse($session->allowsAccess($a1, $ownUser));
        $this->assertFalse($session->allowsAccess($a2, $ownUser));
        $this->assertTrue($session->allowsAccess($a3, $ownUser));
        $this->assertFalse($session->allowsAccess($a4, $ownUser));
    }

    public function testAllowsAccessVideoAnnotation()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $video = VideoTest::create();

        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
        ]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        $a2 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-05',
        ]);

        $a3 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $a4 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
        ]);
        $al4 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::make([
            'volume_id' => $video->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
            'hide_own_annotations' => false,
            'hide_other_users_annotations' => false,
        ]);

        $this->assertTrue($session->allowsAccess($a1, $ownUser));
        $this->assertTrue($session->allowsAccess($a2, $ownUser));
        $this->assertTrue($session->allowsAccess($a3, $ownUser));
        $this->assertTrue($session->allowsAccess($a4, $ownUser));

        $session->hide_own_annotations = true;

        $this->assertFalse($session->allowsAccess($a1, $ownUser));
        $this->assertTrue($session->allowsAccess($a2, $ownUser));
        $this->assertTrue($session->allowsAccess($a3, $ownUser));
        $this->assertTrue($session->allowsAccess($a4, $ownUser));

        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;

        $this->assertTrue($session->allowsAccess($a1, $ownUser));
        $this->assertFalse($session->allowsAccess($a2, $ownUser));
        $this->assertTrue($session->allowsAccess($a3, $ownUser));
        $this->assertFalse($session->allowsAccess($a4, $ownUser));

        $session->hide_own_annotations = true;

        $this->assertFalse($session->allowsAccess($a1, $ownUser));
        $this->assertFalse($session->allowsAccess($a2, $ownUser));
        $this->assertTrue($session->allowsAccess($a3, $ownUser));
        $this->assertFalse($session->allowsAccess($a4, $ownUser));
    }

    public function testStartsAtEndsAtMutator()
    {
        $session = self::create([
            'starts_at' => '2016-09-05T00:00:00.000+02:00',
            'ends_at' => '2016-09-07T00:00:00.000+02:00',
        ]);

        $this->assertTrue(Carbon::parse('2016-09-04T22:00:00.000Z')->eq($session->starts_at));
        $this->assertTrue(Carbon::parse('2016-09-06T22:00:00.000Z')->eq($session->ends_at));
    }

    public function testStartsAtEndsAtISO8601()
    {
        // the timezone may vary between different Biigle instances that run this test
        config(['app.timezone' => 'UTC']);

        $session = self::create([
            'starts_at' => '2016-09-05T00:00:00.000+02:00',
            'ends_at' => '2016-09-07T00:00:00.000+02:00',
        ]);

        $this->assertSame('2016-09-04T22:00:00+00:00', $session->starts_at_iso8601);
        $this->assertSame('2016-09-06T22:00:00+00:00', $session->ends_at_iso8601);

        $this->assertArrayHasKey('starts_at_iso8601', $session->toArray());
        $this->assertArrayHasKey('ends_at_iso8601', $session->toArray());
    }

    public function testAnnotationsImage()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        $a3 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $a4 = ImageAnnotationTest::create([
            'created_at' => '2016-09-06',
        ]);
        $al4 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'volume_id' => $image->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
        ]);
        $session->users()->attach($ownUser);

        $this->assertTrue($session->annotations()->where('id', $a1->id)->exists());
        $this->assertFalse($session->annotations()->where('id', $a2->id)->exists());
        $this->assertFalse($session->annotations()->where('id', $a3->id)->exists());
        $this->assertFalse($session->annotations()->where('id', $a4->id)->exists());
    }

    public function testAnnotationsVideo()
    {
        $ownUser = UserTest::create();
        $otherUser = UserTest::create();
        $video = VideoTest::create([
            'volume_id' => VolumeTest::create(['media_type_id' => MediaType::videoId()]),
        ]);

        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
        ]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $a2 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-05',
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-05',
        ]);

        $a3 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'created_at' => '2016-09-06',
        ]);
        $al3 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a3->id,
            'user_id' => $otherUser->id,
            'created_at' => '2016-09-06',
        ]);

        $a4 = VideoAnnotationTest::create([
            'created_at' => '2016-09-06',
        ]);
        $al4 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a4->id,
            'user_id' => $ownUser->id,
            'created_at' => '2016-09-06',
        ]);

        $session = static::create([
            'volume_id' => $video->volume_id,
            'starts_at' => '2016-09-06',
            'ends_at' => '2016-09-07',
        ]);
        $session->users()->attach($ownUser);

        $this->assertTrue($session->annotations()->where('id', $a1->id)->exists());
        $this->assertFalse($session->annotations()->where('id', $a2->id)->exists());
        $this->assertFalse($session->annotations()->where('id', $a3->id)->exists());
        $this->assertFalse($session->annotations()->where('id', $a4->id)->exists());
    }

    private function isPresent($needle, $haystack){
        $needle = collect($needle)->sortKeys();
        $haystack = $haystack->flatten()->map(fn($l) => collect($l)->sortKeys());
        return $haystack->contains($needle);
    }
}
