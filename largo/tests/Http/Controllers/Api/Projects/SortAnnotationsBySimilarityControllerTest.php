<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\MediaType;
use Biigle\Volume;
use Biigle\Modules\Largo\ImageAnnotationLabelFeatureVector;
use Biigle\Modules\Largo\VideoAnnotationLabelFeatureVector;

class SortAnnotationsBySimilarityControllerTest extends ApiTestCase
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
        $l7 = ImageAnnotationLabelFeatureVector::factory()->create();
        VideoAnnotationLabelFeatureVector::factory()->create();

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/annotations/sort/similarity");

        $this->beUser();
        $this->get("/api/v1/projects/{$id}/annotations/sort/similarity")
            ->assertStatus(403);

        $this->beGuest();

        // Missing arguments.
        $this->getJson("/api/v1/projects/{$id}/annotations/sort/similarity")
            ->assertStatus(422);

        // Label ID does not fit to annotation ID.
        $this->call('GET', "/api/v1/projects/{$id}/annotations/sort/similarity", [
                'label_id' => $l4->label_id,
                'image_annotation_id' => $l1->annotation_id,
            ])
            ->assertStatus(302);

        // Annotation does not belong to project.
        $this->call('GET', "/api/v1/projects/{$id}/annotations/sort/similarity", [
                'label_id' => $l7->label_id,
                'image_annotation_id' => $l7->annotation_id,
            ])
            ->assertStatus(302);

        $this->call('GET', "/api/v1/projects/{$id}/annotations/sort/similarity", [
                'label_id' => $l1->label_id,
                'image_annotation_id' => $l1->annotation_id,
            ])
            ->assertStatus(200)
            ->assertExactJson([
                'v'.$l5->annotation_id,
                'i'.$l2->annotation_id,
                'v'.$l6->annotation_id,
                'i'.$l3->annotation_id,
            ]);
    }

    public function testIndexDuplicate()
    {
        $id = $this->project()->id;
        $vid = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $l1 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $vid,
        ]);
        $l2 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $vid,
            'label_id' => $l1->label_id,
            'annotation_id' => $l1->annotation_id,
        ]);
        $l3 = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $vid,
            'label_id' => $l1->label_id,
        ]);

        $this->beEditor();
        $this->call('GET', "/api/v1/projects/{$id}/annotations/sort/similarity", [
                'label_id' => $l3->label_id,
                'video_annotation_id' => $l3->annotation_id,
            ])
            ->assertStatus(200)
            ->assertExactJson(['v'.$l2->annotation_id]);
    }
}
