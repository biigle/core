<?php

namespace Biigle\Tests\Jobs;

use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Events\LargoSessionFailed;
use Biigle\Events\LargoSessionSaved;
use Biigle\ImageAnnotation;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\Jobs\ApplyLargoSession;
use Biigle\Jobs\RemoveImageAnnotationPatches;
use Biigle\Jobs\RemoveVideoAnnotationPatches;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\VideoAnnotationLabelFeatureVector;
use Biigle\VolumeFile;
use Cache;
use Exception;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Log;
use Mockery;
use TestCase;

class ApplyLargoSessionTest extends TestCase
{
    public function testChangedAlreadyExistsImageAnnotations()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);

        $l1 = LabelTest::create();
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $l2 = LabelTest::create();
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l2->id,
        ]);

        $dismissed = [$al1->label_id => [$a1->id]];
        // This already exists from the same user!
        $changed = [$al2->label_id => [$a1->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->handle();

        $this->assertSame(1, $a1->labels()->count());
        $this->assertSame($al2->id, $a1->labels()->first()->id);
    }

    public function testChangedAlreadyExistsVideoAnnotations()
    {
        $user = UserTest::create();
        $video = VideoTest::create();
        $this->setJobId($video, 'job_id');
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);

        $l1 = LabelTest::create();
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $l2 = LabelTest::create();
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l2->id,
        ]);

        $dismissed = [$al1->label_id => [$a1->id]];
        // This already exists from the same user!
        $changed = [$al2->label_id => [$a1->id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);
        $job->handle();

        $this->assertSame(1, $a1->labels()->count());
        $this->assertSame($al2->id, $a1->labels()->first()->id);
    }

    public function testChangedDuplicateImageAnnotations()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $l1 = LabelTest::create();
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $l2 = LabelTest::create();

        $dismissed = [$al1->label_id => [$a1->id]];
        // The same annotation may occur multiple times e.g. if it should be
        // changed "from A to C" and "from B to C" at the same time.
        $changed = [$l2->id => [$a1->id, $a1->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->handle();

        $this->assertSame(1, $a1->labels()->count());
        $this->assertSame($l2->id, $a1->labels()->first()->label_id);
    }

    public function testChangedDuplicateVideoAnnotations()
    {
        $user = UserTest::create();
        $video = VideoTest::create();
        $this->setJobId($video, 'job_id');
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $l1 = LabelTest::create();
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $l2 = LabelTest::create();

        $dismissed = [$al1->label_id => [$a1->id]];
        // The same annotation may occur multiple times e.g. if it should be
        // changed "from A to C" and "from B to C" at the same time.
        $changed = [$l2->id => [$a1->id, $a1->id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);
        $job->handle();

        $this->assertSame(1, $a1->labels()->count());
        $this->assertSame($l2->id, $a1->labels()->first()->label_id);
    }

    public function testAnnotationMeanwhileDeletedImageAnnotations()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image->id]);

        $l1 = LabelTest::create();
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $l2 = LabelTest::create();

        $dismissed = [$al1->label_id => [$a1->id, $a2->id]];
        $changed = [$l2->id => [$a1->id, $a1->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        // annotation was deleted during the Largo session but saving should still work
        $a2->delete();
        $job->handle();

        $this->assertSame($l2->id, $a1->labels()->first()->label_id);
    }

    public function testAnnotationMeanwhileDeletedVideoAnnotations()
    {
        $user = UserTest::create();
        $video = VideoTest::create();
        $this->setJobId($video, 'job_id');
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $a2 = VideoAnnotationTest::create(['video_id' => $video->id]);

        $l1 = LabelTest::create();
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $l2 = LabelTest::create();

        $dismissed = [$al1->label_id => [$a1->id, $a2->id]];
        $changed = [$l2->id => [$a1->id, $a1->id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);
        // annotation was deleted during the Largo session but saving should still work
        $a2->delete();
        $job->handle();

        $this->assertSame($l2->id, $a1->labels()->first()->label_id);
    }

    public function testLabelMeanwhileDeletedImageAnnotations()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image->id]);

        $l1 = LabelTest::create();
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $l2 = LabelTest::create();
        $l3 = LabelTest::create();

        $dismissed = [$al1->label_id => [$a1->id, $a2->id]];
        $changed = [$l2->id => [$a1->id], $l3->id => [$a2->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);

        $l2->delete();
        $job->handle();

        $this->assertSame($l1->id, $a1->labels()->first()->label_id);
        $this->assertSame($l3->id, $a2->labels()->first()->label_id);
    }

    public function testLabelMeanwhileDeletedVideoAnnotations()
    {
        $user = UserTest::create();
        $video = VideoTest::create();
        $this->setJobId($video, 'job_id');
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $a2 = VideoAnnotationTest::create(['video_id' => $video->id]);

        $l1 = LabelTest::create();
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $l2 = LabelTest::create();
        $l3 = LabelTest::create();

        $dismissed = [$al1->label_id => [$a1->id, $a2->id]];
        $changed = [$l2->id => [$a1->id], $l3->id => [$a2->id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);

        $l2->delete();
        $job->handle();

        $this->assertSame($l1->id, $a1->labels()->first()->label_id);
        $this->assertSame($l3->id, $a2->labels()->first()->label_id);
    }

    public function testDismissImageAnnotations()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->image, 'job_id');

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, [], [], [], false);
        $job->handle();

        // al1 was dismissed but not changed, should be deleted.
        $this->assertFalse($al1->exists());
        $this->assertFalse($al1->annotation()->exists());
        Queue::assertPushed(RemoveImageAnnotationPatches::class);
    }

    public function testDismissVideoAnnotations()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->video, 'job_id');

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, [], false);
        $job->handle();

        // al1 was dismissed but not changed, should be deleted.
        $this->assertFalse($al1->exists());
        $this->assertFalse($al1->annotation()->exists());
        Queue::assertPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testDismissForceImageAnnotations()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->image, 'job_id');
        $user2 = UserTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user2, $dismissed, [], [], [], true);
        $job->handle();

        $this->assertFalse($al1->exists());
        $this->assertFalse($al1->annotation()->exists());
        Queue::assertPushed(RemoveImageAnnotationPatches::class);
    }

    public function testDismissForceVideoAnnotations()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->video, 'job_id');
        $user2 = UserTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user2, [], [], $dismissed, [], true);
        $job->handle();

        $this->assertFalse($al1->exists());
        $this->assertFalse($al1->annotation()->exists());
        Queue::assertPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testChangeOwnImageAnnotations()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->image, 'job_id');
        $annotation = $al1->annotation;
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->handle();

        // al1 was dismissed and then changed, should have a new annotation label
        $this->assertNull($al1->fresh());
        $this->assertSame($l1->id, $annotation->labels()->first()->label_id);
        Queue::assertNotPushed(RemoveImageAnnotationPatches::class);
    }

    public function testChangeOwnVideoAnnotations()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->video, 'job_id');
        $annotation = $al1->annotation;
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);
        $job->handle();

        // al1 was dismissed and then changed, should have a new annotation label
        $this->assertNull($al1->fresh());
        $this->assertSame($l1->id, $annotation->labels()->first()->label_id);
        Queue::assertNotPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testChangeOtherImageAnnotations()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->image, 'job_id');
        $annotation = $al1->annotation;
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $user2 = UserTest::create();
        $job = new ApplyLargoSession('job_id', $user2, $dismissed, $changed, [], [], false);
        $job->handle();

        // a1 was dismissed and changed but the label does not belong to the user,
        // should get a new additional label.
        $this->assertNotNull($al1->fresh());
        $this->assertNotNull($annotation->fresh());
        $this->assertSame(2, $annotation->labels()->count());
        Queue::assertNotPushed(RemoveImageAnnotationPatches::class);
    }

    public function testChangeOtherVideoAnnotations()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->video, 'job_id');
        $annotation = $al1->annotation;
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $user2 = UserTest::create();
        $job = new ApplyLargoSession('job_id', $user2, [], [], $dismissed, $changed, false);
        $job->handle();

        // a1 was dismissed and changed but the label does not belong to the user,
        // should get a new additional label.
        $this->assertNotNull($al1->fresh());
        $this->assertNotNull($annotation->fresh());
        $this->assertSame(2, $annotation->labels()->count());
        Queue::assertNotPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testChangeOtherForceImageAnnotations()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->image, 'job_id');
        $annotation = $al1->annotation;
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $user2 = UserTest::create();
        $job = new ApplyLargoSession('job_id', $user2, $dismissed, $changed, [], [], true);
        $job->handle();

        $this->assertNull($al1->fresh());
        $this->assertNotNull($annotation->fresh());
        $this->assertSame($l1->id, $annotation->labels()->first()->label_id);
        Queue::assertNotPushed(RemoveImageAnnotationPatches::class);
    }

    public function testChangeOtherForceVideoAnnotations()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->video, 'job_id');
        $annotation = $al1->annotation;
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $user2 = UserTest::create();
        $job = new ApplyLargoSession('job_id', $user2, [], [], $dismissed, $changed, true);
        $job->handle();

        $this->assertNull($al1->fresh());
        $this->assertNotNull($annotation->fresh());
        $this->assertSame($l1->id, $annotation->labels()->first()->label_id);
        Queue::assertNotPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testChangeMultipleImageAnnotations()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->image, 'job_id');
        $annotation = $al1->annotation;
        $al2 = ImageAnnotationLabelTest::create([
            'user_id' => $user->id,
            'annotation_id' => $annotation->id,
        ]);
        $l1 = LabelTest::create();
        $l2 = LabelTest::create();

        $dismissed = [
            $al1->label_id => [$al1->annotation_id],
            $al2->label_id => [$al1->annotation_id],
        ];
        $changed = [
            $l1->id => [$al1->annotation_id],
            $l2->id => [$al1->annotation_id],
        ];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->handle();

        $this->assertNull($al1->fresh());
        $this->assertNull($al2->fresh());
        $this->assertNotNull($annotation->fresh());
        $labels = $annotation->labels()->pluck('label_id');
        $this->assertCount(2, $labels);
        $this->assertContains($l1->id, $labels);
        $this->assertContains($l2->id, $labels);
        Queue::assertNotPushed(RemoveImageAnnotationPatches::class);
    }

    public function testChangeMultipleVideoAnnotations()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->video, 'job_id');
        $annotation = $al1->annotation;
        $al2 = VideoAnnotationLabelTest::create([
            'user_id' => $user->id,
            'annotation_id' => $annotation->id,
        ]);
        $l1 = LabelTest::create();
        $l2 = LabelTest::create();

        $dismissed = [
            $al1->label_id => [$al1->annotation_id],
            $al2->label_id => [$al1->annotation_id],
        ];
        $changed = [
            $l1->id => [$al1->annotation_id],
            $l2->id => [$al1->annotation_id],
        ];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);
        $job->handle();

        $this->assertNull($al1->fresh());
        $this->assertNull($al2->fresh());
        $this->assertNotNull($annotation->fresh());
        $labels = $annotation->labels()->pluck('label_id');
        $this->assertCount(2, $labels);
        $this->assertContains($l1->id, $labels);
        $this->assertContains($l2->id, $labels);
        Queue::assertNotPushed(RemoveVideoAnnotationPatches::class);
    }

    public function testRemoveJobIdOnFinishImageAnnotations()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $volume = $al1->annotation->image->volume;
        $l1 = LabelTest::create();

        $volume->attrs = ['largo_job_id' => 'job_id'];
        $volume->save();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->handle();

        $this->assertEmpty($volume->fresh()->attrs);
    }

    public function testRemoveJobIdOnFinishVideoAnnotations()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $volume = $al1->annotation->video->volume;
        $l1 = LabelTest::create();

        $volume->attrs = ['largo_job_id' => 'job_id'];
        $volume->save();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);
        $job->handle();

        $this->assertEmpty($volume->fresh()->attrs);
    }

    public function testRemoveJobIdOnErrorImageAnnotations()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $volume = $al1->annotation->image->volume;
        $l1 = LabelTest::create();

        $volume->attrs = ['largo_job_id' => 'job_id'];
        $volume->save();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->failed(null);

        $this->assertEmpty($volume->fresh()->attrs);
    }

    public function testRemoveJobIdOnErrorVideoAnnotations()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $volume = $al1->annotation->video->volume;
        $l1 = LabelTest::create();

        $volume->attrs = ['largo_job_id' => 'job_id'];
        $volume->save();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);
        $job->failed(null);

        $this->assertEmpty($volume->fresh()->attrs);
    }

    public function testDispatchEventOnSuccess()
    {
        Event::fake();
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->image, 'job_id');
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->handle();

        Event::assertDispatched(function (LargoSessionSaved $event) use ($user) {
            $this->assertSame($user->id, $event->user->id);
            $this->assertSame('job_id', $event->id);
            $this->assertFalse($event->hasUnchanged);
            return true;
        });
        $this->assertNull(Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id')));
    }

    public function testDispatchEventOnError()
    {
        Event::fake();
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->image, 'job_id');
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->failed(null);

        Event::assertDispatched(function (LargoSessionFailed $event) use ($user) {
            $this->assertSame($user->id, $event->user->id);
            $this->assertSame('job_id', $event->id);
            return true;
        });
    }

    public function testChangeImageAnnotationCopyFeatureVector()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->image, 'job_id');
        $vector1 = ImageAnnotationLabelFeatureVector::factory()->create([
            'id' => $al1->id,
            'annotation_id' => $al1->annotation_id,
        ]);
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->handle();

        $vectors = ImageAnnotationLabelFeatureVector::where('annotation_id', $al1->annotation_id)->get();
        $this->assertCount(1, $vectors);
        $this->assertNotEquals($al1->id, $vectors[0]->id);
        $this->assertSame($l1->id, $vectors[0]->label_id);
        $this->assertEquals($vector1->vector, $vectors[0]->vector);
    }

    public function testChangeVideoAnnotationCopyFeatureVector()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create(['user_id' => $user->id]);
        $this->setJobId($al1->annotation->video, 'job_id');
        $vector1 = VideoAnnotationLabelFeatureVector::factory()->create([
            'id' => $al1->id,
            'annotation_id' => $al1->annotation_id,
        ]);
        $l1 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l1->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);
        $job->handle();

        $vectors = VideoAnnotationLabelFeatureVector::where('annotation_id', $al1->annotation_id)->get();
        $this->assertCount(1, $vectors);
        $this->assertNotEquals($al1->id, $vectors[0]->id);
        $this->assertSame($l1->id, $vectors[0]->label_id);
        $this->assertEquals($vector1->vector, $vectors[0]->vector);
    }

    public function testDismissButChangeBackToSameLabelImage()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
        ]);

        $a2 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $al1->label_id,
        ]);

        $dismissed = [$al1->label_id => [$a1->id, $a2->id]];
        $changed = [$al1->label_id => [$a1->id, $a2->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->handle();

        $this->assertNotNull($a1->fresh());
        $this->assertNotNull($a2->fresh());
    }

    public function testDismissButChangeBackToSameLabelVideo()
    {
        $user = UserTest::create();
        $video = VideoTest::create();
        $this->setJobId($video, 'job_id');
        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
        ]);

        $a2 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $al1->label_id,
        ]);

        $dismissed = [$al1->label_id => [$a1->id, $a2->id]];
        $changed = [$al1->label_id => [$a1->id, $a2->id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false);
        $job->handle();

        $this->assertNotNull($a1->fresh());
        $this->assertNotNull($a2->fresh());
    }

    public function testChunkDismissedAnnotations()
    {
        // Set a very low parameter limit to test chunking
        // With limit of 5: chunkSize = 5 - 2 = 3 (accounting for label_id and user_id params)
        config(['biigle.db_param_limit' => 5]);
        
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        
        // Create multiple annotations with the same label
        $annotations = [];
        $label = LabelTest::create();
        
        for ($i = 0; $i < 7; $i++) {
            $annotation = ImageAnnotationTest::create(['image_id' => $image->id]);
            $annotations[] = $annotation;
            ImageAnnotationLabelTest::create([
                'annotation_id' => $annotation->id,
                'user_id' => $user->id,
                'label_id' => $label->id,
            ]);
        }
        
        $annotationIds = collect($annotations)->pluck('id')->toArray();
        $dismissed = [$label->id => $annotationIds];
        
        $job = new ApplyLargoSession('job_id', $user, $dismissed, [], [], [], false);
        $job->handle();
        
        // All annotation labels should be dismissed and annotations deleted
        $this->assertFalse(ImageAnnotation::whereIn('id', $annotationIds)->exists());
    }

    public function testGuidelineLabelImageAnnotations()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $l1 = LabelTest::create();
        $allowed = LabelTest::create();
        $notAllowed = LabelTest::create();
        $guideline = AnnotationGuideline::factory()->create(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $allowed->id,
        ]);

        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        $al1 = ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image->id]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $dismissed = [$l1->id => [$a1->id, $a2->id]];
        $changed = [$notAllowed->id => [$a1->id], $allowed->id => [$a2->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false, $guideline->id);
        $job->handle();

        // The change of a1 is rejected and the old label is kept.
        $this->assertNotNull($al1->fresh());
        $this->assertSame([$l1->id], $a1->labels()->pluck('label_id')->all());
        $this->assertSame([$allowed->id], $a2->labels()->pluck('label_id')->all());

        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        $this->assertSame([$a1->id], $unchanged['image_annotations']);
        $this->assertSame([], $unchanged['video_annotations']);
        $this->assertTrue($unchanged['guideline']);
        $this->assertFalse($unchanged['other_user']);
    }

    public function testGuidelineLabelVideoAnnotations()
    {
        $user = UserTest::create();
        $video = VideoTest::create();
        $this->setJobId($video, 'job_id');
        $l1 = LabelTest::create();
        $allowed = LabelTest::create();
        $notAllowed = LabelTest::create();
        $guideline = AnnotationGuideline::factory()->create(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $allowed->id,
        ]);

        $a1 = VideoAnnotationTest::create(['video_id' => $video->id]);
        $al1 = VideoAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);
        $a2 = VideoAnnotationTest::create(['video_id' => $video->id]);
        VideoAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $dismissed = [$l1->id => [$a1->id, $a2->id]];
        $changed = [$notAllowed->id => [$a1->id], $allowed->id => [$a2->id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, $changed, false, $guideline->id);
        $job->handle();

        $this->assertNotNull($al1->fresh());
        $this->assertSame([$l1->id], $a1->labels()->pluck('label_id')->all());
        $this->assertSame([$allowed->id], $a2->labels()->pluck('label_id')->all());

        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        $this->assertSame([], $unchanged['image_annotations']);
        $this->assertSame([$a1->id], $unchanged['video_annotations']);
        $this->assertTrue($unchanged['guideline']);
    }

    public function testGuidelineOnlyShapes()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $l1 = LabelTest::create();
        $l2 = LabelTest::create();
        $guideline = AnnotationGuideline::factory()->create([
            'enforced' => true,
            'only_shapes' => [Shape::circleId()],
        ]);

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::pointId(),
            'points' => [10, 10],
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);
        $a2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::circleId(),
            'points' => [10, 10, 5],
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $dismissed = [$l1->id => [$a1->id, $a2->id]];
        $changed = [$l2->id => [$a1->id, $a2->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false, $guideline->id);
        $job->handle();

        $this->assertSame([$l1->id], $a1->labels()->pluck('label_id')->all());
        $this->assertSame([$l2->id], $a2->labels()->pluck('label_id')->all());

        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        $this->assertSame([$a1->id], $unchanged['image_annotations']);
    }

    public function testGuidelineLabelShape()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $l1 = LabelTest::create();
        $l2 = LabelTest::create();
        $guideline = AnnotationGuideline::factory()->create(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $l2->id,
            'shape_id' => Shape::circleId(),
        ]);

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::pointId(),
            'points' => [10, 10],
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);
        $a2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::circleId(),
            'points' => [10, 10, 5],
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a2->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $dismissed = [$l1->id => [$a1->id, $a2->id]];
        $changed = [$l2->id => [$a1->id, $a2->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false, $guideline->id);
        $job->handle();

        $this->assertSame([$l1->id], $a1->labels()->pluck('label_id')->all());
        $this->assertSame([$l2->id], $a2->labels()->pluck('label_id')->all());

        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        $this->assertSame([$a1->id], $unchanged['image_annotations']);
    }

    public function testGuidelineForce()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->image, 'job_id');
        $l2 = LabelTest::create();
        $guideline = AnnotationGuideline::factory()->create(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $al1->label_id,
        ]);

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l2->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], true, $guideline->id);
        $job->handle();

        // The guideline also applies with force.
        $this->assertSame([$al1->label_id], $al1->annotation->labels()->pluck('label_id')->all());

        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        $this->assertSame([$al1->annotation_id], $unchanged['image_annotations']);
    }

    public function testGuidelineDeleted()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $l1 = LabelTest::create();
        $allowed = LabelTest::create();
        $notAllowed = LabelTest::create();
        $guideline = AnnotationGuideline::factory()->create(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $allowed->id,
        ]);

        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $dismissed = [$l1->id => [$a1->id]];
        $changed = [$notAllowed->id => [$a1->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false, $guideline->id);
        $guideline->delete();
        $job->handle();

        // Nothing is restricted if the guideline no longer exists.
        $this->assertSame([$notAllowed->id], $a1->labels()->pluck('label_id')->all());
        $this->assertNull(Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id')));
    }

    public function testGuidelineNotEnforced()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $l1 = LabelTest::create();
        $allowed = LabelTest::create();
        $notAllowed = LabelTest::create();
        $guideline = AnnotationGuideline::factory()->create([
            'enforced' => false,
            'only_shapes' => [Shape::circleId()],
        ]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $allowed->id,
        ]);

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::pointId(),
            'points' => [10, 10],
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);

        $dismissed = [$l1->id => [$a1->id]];
        $changed = [$notAllowed->id => [$a1->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false, $guideline->id);
        $job->handle();

        // Nothing is restricted if the guideline is not enforced.
        $this->assertSame([$notAllowed->id], $a1->labels()->pluck('label_id')->all());
        $this->assertNull(Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id')));
    }

    public function testGuidelineChunkShapes()
    {
        // chunkSize = 4 - 1 = 3 (accounting for the one shape ID param). Must be at
        // least 4 because getKeptAnnotations() subtracts 3.
        config(['biigle.db_param_limit' => 4]);

        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $l1 = LabelTest::create();
        $l2 = LabelTest::create();
        $guideline = AnnotationGuideline::factory()->create([
            'enforced' => true,
            'only_shapes' => [Shape::circleId()],
        ]);

        $points = [];
        for ($i = 0; $i < 3; $i++) {
            $points[] = ImageAnnotationTest::create([
                'image_id' => $image->id,
                'shape_id' => Shape::pointId(),
                'points' => [10, 10],
            ]);
        }
        $circle = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::circleId(),
            'points' => [10, 10, 5],
        ]);
        $annotations = array_merge($points, [$circle]);
        foreach ($annotations as $annotation) {
            ImageAnnotationLabelTest::create([
                'annotation_id' => $annotation->id,
                'user_id' => $user->id,
                'label_id' => $l1->id,
            ]);
        }

        $annotationIds = array_map(fn ($a) => $a->id, $annotations);
        $dismissed = [$l1->id => $annotationIds];
        $changed = [$l2->id => $annotationIds];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false, $guideline->id);
        $job->handle();

        foreach ($points as $point) {
            $this->assertSame([$l1->id], $point->labels()->pluck('label_id')->all());
        }
        $this->assertSame([$l2->id], $circle->labels()->pluck('label_id')->all());

        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        $pointIds = array_map(fn ($a) => $a->id, $points);
        sort($unchanged['image_annotations']);
        $this->assertSame($pointIds, $unchanged['image_annotations']);
    }

    public function testGuidelineRejectWholeAnnotation()
    {
        $user = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $l1 = LabelTest::create();
        $l2 = LabelTest::create();
        $allowed = LabelTest::create();
        $notAllowed = LabelTest::create();
        $guideline = AnnotationGuideline::factory()->create(['enforced' => true]);
        AnnotationGuidelineLabel::factory()->create([
            'annotation_guideline_id' => $guideline->id,
            'label_id' => $allowed->id,
        ]);

        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l1->id,
        ]);
        ImageAnnotationLabelTest::create([
            'annotation_id' => $a1->id,
            'user_id' => $user->id,
            'label_id' => $l2->id,
        ]);

        // The annotation was dismissed for both labels and should get two new labels.
        // One of them is not allowed so nothing should change.
        $dismissed = [$l1->id => [$a1->id], $l2->id => [$a1->id]];
        $changed = [$notAllowed->id => [$a1->id], $allowed->id => [$a1->id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false, $guideline->id);
        $job->handle();

        $labelIds = $a1->labels()->orderBy('label_id')->pluck('label_id')->all();
        $this->assertSame([$l1->id, $l2->id], $labelIds);

        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        $this->assertSame([$a1->id], $unchanged['image_annotations']);
    }

    public function testUnchangedOtherUserImageAnnotations()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->image, 'job_id');

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, [], [], [], false);
        $job->handle();

        // The annotation was not deleted because the label belongs to another user.
        $this->assertNotNull($al1->fresh());
        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        $this->assertSame([$al1->annotation_id], $unchanged['image_annotations']);
        $this->assertSame([], $unchanged['video_annotations']);
        $this->assertFalse($unchanged['guideline']);
        $this->assertTrue($unchanged['other_user']);
        $this->assertSame($user->id, $unchanged['user_id']);
    }

    public function testUnchangedOtherUserVideoAnnotations()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->video, 'job_id');

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, [], false);
        $job->handle();

        $this->assertNotNull($al1->fresh());
        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        $this->assertSame([], $unchanged['image_annotations']);
        $this->assertSame([$al1->annotation_id], $unchanged['video_annotations']);
        $this->assertTrue($unchanged['other_user']);
    }

    public function testUnchangedOtherUserAndOwnLabel()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->image, 'job_id');
        $al2 = ImageAnnotationLabelTest::create([
            'annotation_id' => $al1->annotation_id,
            'label_id' => $al1->label_id,
            'user_id' => $user->id,
        ]);

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, [], [], [], false);
        $job->handle();

        // The own label is detached so the annotation was changed and is not reported.
        $this->assertNull($al2->fresh());
        $this->assertNotNull($al1->fresh());
        $this->assertNull(Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id')));

        // If the user dismisses the annotation again, it is reported.
        $this->setJobId($al1->annotation->image, 'job_id2');
        $job = new ApplyLargoSession('job_id2', $user, $dismissed, [], [], [], false);
        $job->handle();

        $this->assertNotNull($al1->fresh());
        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id2'));
        $this->assertSame([$al1->annotation_id], $unchanged['image_annotations']);
        $this->assertTrue($unchanged['other_user']);
    }

    public function testUnchangedOtherUserAndOwnLabelVideo()
    {
        $user = UserTest::create();
        $al1 = VideoAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->video, 'job_id');
        $al2 = VideoAnnotationLabelTest::create([
            'annotation_id' => $al1->annotation_id,
            'label_id' => $al1->label_id,
            'user_id' => $user->id,
        ]);

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, [], [], $dismissed, [], false);
        $job->handle();

        $this->assertNull($al2->fresh());
        $this->assertNotNull($al1->fresh());
        $this->assertNull(Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id')));
    }

    public function testUnchangedOtherUserChunk()
    {
        // chunkSize = 4 - 3 = 1 (accounting for label_id and two user_id params)
        config(['biigle.db_param_limit' => 4]);

        $user = UserTest::create();
        $otherUser = UserTest::create();
        $image = ImageTest::create();
        $this->setJobId($image, 'job_id');
        $label = LabelTest::create();

        $annotationIds = [];
        for ($i = 0; $i < 3; $i++) {
            $annotation = ImageAnnotationTest::create(['image_id' => $image->id]);
            $annotationIds[] = $annotation->id;
            ImageAnnotationLabelTest::create([
                'annotation_id' => $annotation->id,
                'user_id' => $otherUser->id,
                'label_id' => $label->id,
            ]);
        }

        $dismissed = [$label->id => $annotationIds];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, [], [], [], false);
        $job->handle();

        $this->assertSame(3, ImageAnnotation::whereIn('id', $annotationIds)->count());
        $unchanged = Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id'));
        sort($unchanged['image_annotations']);
        $this->assertSame($annotationIds, $unchanged['image_annotations']);
        $this->assertTrue($unchanged['other_user']);
    }

    public function testUnchangedOtherUserChanged()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->image, 'job_id');
        $l2 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l2->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], false);
        $job->handle();

        // The annotation got the new label and keeps the label of the other user. This
        // is not reported.
        $labelIds = $al1->annotation->labels()->orderBy('label_id')->pluck('label_id')->all();
        $this->assertSame([$al1->label_id, $l2->id], $labelIds);
        $this->assertNull(Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id')));
    }

    public function testUnchangedOtherUserChangedForce()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->image, 'job_id');
        $l2 = LabelTest::create();

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $changed = [$l2->id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, $changed, [], [], true);
        $job->handle();

        // The label of the other user is replaced with force.
        $this->assertNull($al1->fresh());
        $this->assertSame([$l2->id], $al1->annotation->labels()->pluck('label_id')->all());
        $this->assertNull(Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id')));
    }

    public function testUnchangedOtherUserForce()
    {
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->image, 'job_id');

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, [], [], [], true);
        $job->handle();

        // The label of the other user is detached with force, so the annotation is
        // deleted.
        $this->assertNull($al1->annotation->fresh());
        $this->assertNull(Cache::get(ApplyLargoSession::getUnchangedCacheKey('job_id')));
    }

    public function testDispatchEventWithUnchanged()
    {
        Event::fake();
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->image, 'job_id');

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        $job = new ApplyLargoSession('job_id', $user, $dismissed, [], [], [], false);
        $job->handle();

        Event::assertDispatched(function (LargoSessionSaved $event) {
            $this->assertTrue($event->hasUnchanged);
            $this->assertTrue($event->broadcastWith()['has_unchanged']);

            return true;
        });
    }

    public function testDispatchEventWithUnchangedCacheFailure()
    {
        Event::fake();
        $user = UserTest::create();
        $al1 = ImageAnnotationLabelTest::create();
        $this->setJobId($al1->annotation->image, 'job_id');

        $dismissed = [$al1->label_id => [$al1->annotation_id]];
        // Mock the job instead of the Cache facade because the facade is used in many
        // other places, too.
        $job = Mockery::mock(ApplyLargoSession::class, ['job_id', $user, $dismissed, [], [], [], false])
            ->makePartial()
            ->shouldAllowMockingProtectedMethods();
        $job->shouldReceive('storeUnchangedAnnotations')
            ->once()
            ->andThrow(new Exception('cache down'));
        Log::shouldReceive('warning')->once();
        $job->handle();

        Event::assertDispatched(function (LargoSessionSaved $event) {
            $this->assertFalse($event->hasUnchanged);

            return true;
        });
        Event::assertNotDispatched(LargoSessionFailed::class);
    }

    protected function setJobId(VolumeFile $file, string $id): void
    {
        $attrs = $file->volume->attrs ?? [];
        $attrs['largo_job_id'] = $id;
        $file->volume->attrs = $attrs;
        $file->volume->save();
    }
}
