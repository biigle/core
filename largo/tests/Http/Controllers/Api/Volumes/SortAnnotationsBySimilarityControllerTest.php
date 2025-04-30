<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;

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
            ])
            ->assertStatus(302);

        // Annotation does not belong to volume.
        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
                'label_id' => $l5->label_id,
                'annotation_id' => $l5->annotation_id,
            ])
            ->assertStatus(302);

        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
                'label_id' => $l1->label_id,
                'annotation_id' => $l1->annotation_id,
            ])
            ->assertStatus(200)
            ->assertExactJson([
                $l2->annotation_id,
                $l3->annotation_id,
            ]);

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
            ])
            ->assertStatus(200)
            ->assertExactJson([$l3->annotation_id]);
    }

    public function testIndexVideo()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
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
            ])
            ->assertStatus(302);

        // Annotation does not belong to volume.
        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
                'label_id' => $l5->label_id,
                'annotation_id' => $l5->annotation_id,
            ])
            ->assertStatus(302);

        $this->call('GET', "/api/v1/volumes/{$id}/annotations/sort/similarity", [
                'label_id' => $l1->label_id,
                'annotation_id' => $l1->annotation_id,
            ])
            ->assertStatus(200)
            ->assertExactJson([
                $l2->annotation_id,
                $l3->annotation_id,
            ]);
    }

    public function testIndexDuplicateVideo()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
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
            ])
            ->assertStatus(200)
            ->assertExactJson([$l3->annotation_id]);
    }
}
