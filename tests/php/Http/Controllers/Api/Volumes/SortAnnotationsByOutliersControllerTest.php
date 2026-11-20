<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Enums\MediaType;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\Tests\AnnotationSessionTest;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoTest;
use Biigle\VideoAnnotationLabelFeatureVector;
use Carbon\Carbon;

class SortAnnotationsByOutliersControllerTest extends ApiTestCase
{
    public function testIndexImage()
    {
        $id = $this->volume()->id;
        $l1 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
        ]);
        $l2 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
            'label_id' => $l1->label_id,
        ]);
        $l3 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
            'label_id' => $l1->label_id,
            // The other feature vectors are identical so this one will be an outlier.
            'vector' => range(1, 384),
        ]);
        $l4 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
        ]);

        // Annotations from other volume should not appear.
        ImageAnnotationLabelFeatureVector::factory()->create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotations/sort/outliers/{$l1->label_id}");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(403);

        $this->beGuest();

        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([
                $l3->annotation_id,
                $l2->annotation_id,
                $l1->annotation_id,
            ]);

        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l4->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$l4->annotation_id]);
    }

    public function testIndexImageAnnotationSession()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);
        $label = LabelTest::create();
        $annotationLabels = [
            // Own annotation before the annotation session.
            [Carbon::yesterday(), $this->editor()],
            // Own annotation of the annotation session.
            [Carbon::today(), $this->editor()],
            // Annotation of another user.
            [Carbon::today(), $this->admin()],
        ];
        $annotationIds = [];
        foreach ($annotationLabels as [$createdAt, $user]) {
            $a = ImageAnnotationTest::create([
                'image_id' => $image->id,
                'created_at' => $createdAt,
            ]);
            $al = ImageAnnotationLabelTest::create([
                'annotation_id' => $a->id,
                'label_id' => $label->id,
                'user_id' => $user->id,
            ]);
            // All vectors are identical so the annotations are sorted by ID.
            ImageAnnotationLabelFeatureVector::factory()->create([
                'id' => $al->id,
                'annotation_id' => $a->id,
                'label_id' => $label->id,
                'volume_id' => $id,
            ]);
            $annotationIds[] = $a->id;
        }
        [$a1, $a2, $a3] = $annotationIds;

        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => false,
        ]);
        $session->users()->attach($this->editor());

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$label->id}")
            ->assertStatus(200)
            ->assertExactJson([$a3, $a2]);

        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;
        $session->save();

        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$label->id}")
            ->assertStatus(200)
            ->assertExactJson([$a2, $a1]);

        $session->hide_own_annotations = true;
        $session->save();

        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$label->id}")
            ->assertStatus(200)
            ->assertExactJson([$a2]);

        $session->users()->detach($this->editor());

        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$label->id}")
            ->assertStatus(200)
            ->assertExactJson([$a3, $a2, $a1]);
    }

    public function testIndexVideoAnnotationSession()
    {
        $id = $this->volume(['media_type' => MediaType::VIDEO])->id;
        $video = VideoTest::create(['volume_id' => $id]);
        $label = LabelTest::create();
        $annotationLabels = [
            [Carbon::yesterday(), $this->editor()],
            [Carbon::today(), $this->editor()],
            [Carbon::today(), $this->admin()],
        ];
        $annotationIds = [];
        foreach ($annotationLabels as [$createdAt, $user]) {
            $a = VideoAnnotationTest::create([
                'video_id' => $video->id,
                'created_at' => $createdAt,
            ]);
            $al = VideoAnnotationLabelTest::create([
                'annotation_id' => $a->id,
                'label_id' => $label->id,
                'user_id' => $user->id,
            ]);
            VideoAnnotationLabelFeatureVector::factory()->create([
                'id' => $al->id,
                'annotation_id' => $a->id,
                'label_id' => $label->id,
                'volume_id' => $id,
            ]);
            $annotationIds[] = $a->id;
        }
        [$a1, $a2, $a3] = $annotationIds;

        $session = AnnotationSessionTest::create([
            'volume_id' => $id,
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::tomorrow(),
            'hide_own_annotations' => true,
            'hide_other_users_annotations' => true,
        ]);
        $session->users()->attach($this->editor());

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$label->id}")
            ->assertStatus(200)
            ->assertExactJson([$a2]);
    }

    public function testIndexDuplicateImage()
    {
        $id = $this->volume()->id;
        $l1 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
        ]);
        $l2 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ]);

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$l1->annotation_id]);
    }

    public function testIndexVideo()
    {
        $id = $this->volume(['media_type' => MediaType::VIDEO])->id;
        $l1 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
        ]);
        $l2 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
            'label_id' => $l1->label_id,
        ]);
        $l3 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
            'label_id' => $l1->label_id,
            // The other feature vectors are identical so this one will be an outlier.
            'vector' => range(1, 384),
        ]);
        $l4 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
        ]);

        // Annotations from other volume should not appear.
        VideoAnnotationLabelFeatureVector::factory()->create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotations/sort/outliers/{$l1->label_id}");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(403);

        $this->beGuest();

        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([
                $l3->annotation_id,
                $l2->annotation_id,
                $l1->annotation_id,
            ]);

        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l4->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$l4->annotation_id]);
    }

    public function testIndexDuplicateVideo()
    {
        $id = $this->volume(['media_type' => MediaType::VIDEO])->id;
        $l1 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
        ]);
        $l2 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ]);

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$l1->annotation_id]);
    }
}
