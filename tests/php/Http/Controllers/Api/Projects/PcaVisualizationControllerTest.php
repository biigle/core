<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\ImageAnnotationLabelFeatureVector;
use Biigle\MediaType;
use Biigle\VideoAnnotationLabelFeatureVector;
use Biigle\Volume;

class PcaVisualizationControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;

        $this->doTestApiRoute('GET', "/api/v1/projects/{$id}/pca-visualization");

        $this->beUser();
        $response = $this->getJson("/api/v1/projects/{$id}/pca-visualization");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->getJson("/api/v1/projects/{$id}/pca-visualization");
        $response->assertStatus(200);
        $response->assertJson([
            'data' => [],
            'count' => 0,
        ]);
    }

    public function testIndexWithFeatureVectors()
    {
        $v1 = Volume::factory()->create();
        $this->project()->addVolumeId($v1->id);

        $v2 = Volume::factory()->create(['media_type_id' => MediaType::videoId()]);
        $this->project()->addVolumeId($v2->id);

        // Create image feature vectors
        $imageVector = ImageAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $v1->id,
            'vector' => range(0, 383),
        ]);

        // Create video feature vectors  
        $videoVector = VideoAnnotationLabelFeatureVector::factory()->create([
            'volume_id' => $v2->id,
            'vector' => range(1, 384),
        ]);

        $this->beGuest();
        $response = $this->getJson("/api/v1/projects/{$this->project()->id}/pca-visualization");
        $response->assertStatus(200);
        
        $data = $response->json();
        $this->assertIsArray($data['data']);
        $this->assertEquals(2, $data['count']);
        
        // Check that both annotations are included
        $ids = array_column($data['data'], 'id');
        $this->assertContains($imageVector->id, $ids);
        $this->assertContains($videoVector->id, $ids);
        
        // Check that PCA coordinates are present
        foreach ($data['data'] as $point) {
            $this->assertArrayHasKey('x', $point);
            $this->assertArrayHasKey('y', $point);
            $this->assertArrayHasKey('label_name', $point);
            $this->assertArrayHasKey('label_color', $point);
        }
    }

    public function testIndexWithNoFeatureVectors()
    {
        $this->beGuest();
        $response = $this->getJson("/api/v1/projects/{$this->project()->id}/pca-visualization");
        $response->assertStatus(200);
        $response->assertJson([
            'data' => [],
            'count' => 0,
            'message' => 'No feature vectors found for this project.',
        ]);
    }
}
