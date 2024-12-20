<?php

namespace Biigle\Tests\Modules\Largo\Jobs;

use Biigle\Modules\Largo\Events\LargoSessionFailed;
use Biigle\Modules\Largo\Events\LargoSessionSaved;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\Jobs\ApplyLargoSession;
use Biigle\Modules\Largo\Jobs\RemoveImageAnnotationPatches;
use Biigle\Modules\Largo\Jobs\RemoveVideoAnnotationPatches;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\VolumeFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
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
            return true;
        });
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

    protected function setJobId(VolumeFile $file, string $id): void
    {
        $attrs = $file->volume->attrs ?? [];
        $attrs['largo_job_id'] = $id;
        $file->volume->attrs = $attrs;
        $file->volume->save();
    }
}
