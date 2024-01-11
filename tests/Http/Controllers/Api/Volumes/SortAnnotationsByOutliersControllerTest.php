<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;

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
                $l1->annotation_id,
                $l2->annotation_id,
            ]);

        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l4->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$l4->annotation_id]);
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
                $l1->annotation_id,
                $l2->annotation_id,
            ]);

        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l4->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$l4->annotation_id]);
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

        $this->beEditor();
        $this->get("/api/v1/volumes/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([$l1->annotation_id]);
    }
}
