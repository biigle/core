<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\MediaType;
use Biigle\VideoAnnotationLabelFeatureVector;
use Biigle\Volume;

class SortAnnotationsByOutliersControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;

        $v1 = Volume::factory()->create();
        $this->project()->addVolumeId($v1->id);

        $l1 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $v1->id,
        ]);
        $l2 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $v1->id,
            'label_id' => $l1->label_id,
        ]);
        $l3 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $v1->id,
            'label_id' => $l1->label_id,
            // The other feature vectors are identical so this one will be an outlier.
            'vector' => range(1, 384),
        ]);
        $l4 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $v1->id,
        ]);

        $v2 = Volume::factory()->create(['media_type_id' => MediaType::videoId()]);
        $this->project()->addVolumeId($v2->id);

        $l5 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $v2->id,
            'label_id' => $l1->label_id,
        ]);
        $l6 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $v2->id,
            'label_id' => $l1->label_id,
            'vector' => range(1, 384),
        ]);

        // Annotations from other volume should not appear.
        ImageAnnotationLabelFeatureVector::factory()->create();
        VideoAnnotationLabelFeatureVector::factory()->create();

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/annotations/sort/outliers/{$l1->label_id}");

        $this->beUser();
        $this->get("/api/v1/projects/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(403);

        $this->beGuest();

        $this->get("/api/v1/projects/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson([
                'v'.$l6->annotation_id,
                'i'.$l3->annotation_id,
                'v'.$l5->annotation_id,
                'i'.$l2->annotation_id,
                'i'.$l1->annotation_id,
            ]);

        $this->get("/api/v1/projects/{$id}/annotations/sort/outliers/{$l4->label_id}")
            ->assertStatus(200)
            ->assertExactJson(['i'.$l4->annotation_id]);
    }

    public function testIndexDuplicate()
    {
        $id = $this->project()->id;
        $vid = $this->volume()->id;
        $l1 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $vid,
        ]);
        $l2 = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $vid,
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ]);

        $this->beEditor();
        $this->get("/api/v1/projects/{$id}/annotations/sort/outliers/{$l1->label_id}")
            ->assertStatus(200)
            ->assertExactJson(['i'.$l1->annotation_id]);
    }
}
