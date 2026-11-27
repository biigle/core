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
use Biigle\VideoAnnotationLabelFeatureVector;
use Carbon\Carbon;

class SortAnnotationsBySimilarityControllerTest extends ApiTestCase
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
        $l5 = ImageAnnotationLabelFeatureVector::factory()->create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/annotations/sort/similarity")
            ->assertStatus(403);

        $this->beGuest();

        // Missing arguments.
        $this->getJson("/api/v1/volumes/{$id}/annotations/sort/similarity")
            ->assertStatus(422);

        // Label ID does not fit to annotation ID.
        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
            'label_id' => $l4->label_id,
            'annotation_id' => $l1->annotation_id,
        ])->assertStatus(302);

        // Annotation does not belong to volume.
        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
            'label_id' => $l5->label_id,
            'annotation_id' => $l5->annotation_id,
        ])->assertStatus(302);

        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ])->assertStatus(200)->assertExactJson([
            $l2->annotation_id,
            $l3->annotation_id,
        ]);
    }

    public function testIndexImageAnnotationSession()
    {
        $id = $this->volume()->id;
        $image = ImageTest::create(['volume_id' => $id]);
        $label = LabelTest::create();
        $annotationLabels = [
            // Own annotation before the annotation session.
            [Carbon::yesterday(), $this->editor()],
            // Own annotation of the annotation session (the reference).
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

        $url = "/api/v1/volumes/{$id}/annotations/sort/similarity?label_id={$label->id}&annotation_id={$a2}";

        $this->beEditor();
        $this->get($url)->assertStatus(200)->assertExactJson([$a3]);

        $session->hide_own_annotations = false;
        $session->hide_other_users_annotations = true;
        $session->save();

        $this->get($url)->assertStatus(200)->assertExactJson([$a1]);

        $session->users()->detach($this->editor());

        $this->get($url)->assertStatus(200)->assertExactJson([$a3, $a1]);
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
        $l3 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ]);

        $this->beEditor();
        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ])->assertStatus(200)->assertExactJson([$l3->annotation_id]);
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
        $l5 = VideoAnnotationLabelFeatureVector::factory()->create();

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity");

        $this->beUser();
        $this->get("/api/v1/volumes/{$id}/annotations/sort/similarity")
            ->assertStatus(403);

        $this->beGuest();

        // Missing arguments.
        $this->getJson("/api/v1/volumes/{$id}/annotations/sort/similarity")
            ->assertStatus(422);

        // Label ID does not fit to annotation ID.
        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
            'label_id' => $l4->label_id,
            'annotation_id' => $l1->annotation_id,
        ])->assertStatus(302);

        // Annotation does not belong to volume.
        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
            'label_id' => $l5->label_id,
            'annotation_id' => $l5->annotation_id,
        ])->assertStatus(302);

        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ])->assertStatus(200)->assertExactJson([
            $l2->annotation_id,
            $l3->annotation_id,
        ]);
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
        $l3 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $id,
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ]);

        $this->beEditor();
        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ])->assertStatus(200)->assertExactJson([$l3->annotation_id]);
    }
}
