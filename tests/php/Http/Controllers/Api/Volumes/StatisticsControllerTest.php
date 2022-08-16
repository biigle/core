<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\Tests\ImageTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageAnnotationLabelTest;

class StatisticsControllerTest extends ApiTestCase
{
    public function testStatistics()
    {
        $id = $this->volume()->id;

        $this->doTestApiRoute('GET', "/api/v1/volumes/{$id}/statistics");

        $this->beUser();
        $response = $this->get("/api/v1/volumes/{$id}/statistics");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/statistics")
            ->assertStatus(200);
        
        $expect = [
            'annotationTimeSeries' => [],
            'volumeAnnotations' => [],
            'volumeName' => $this->volume()->name,
            'annotatedImages' => 0,
            'totalImages' => 0,
            'annotationLabels' => [],
            'sourceTargetLabels' => []
        ];
        $response->assertExactJson($expect);
    }

    public function testInitialStatistics() 
    {
        $id = $this->volume()->id;

        $image = ImageTest::create([
            'volume_id' => $this->volume()->id,
        ]);

        // create another image on same volume
        ImageTest::create([
            'filename' => 'test-image2.jpg',
            'volume_id' => $this->volume()->id,
        ]);

        $annotation1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation1->id,
        ]);

        $annotation2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
        ]);

        ImageAnnotationLabelTest::create([
            'annotation_id' => $annotation2->id,
        ]);

        $this->beGuest();
        $response = $this->get("/api/v1/volumes/{$id}/statistics")
            ->assertStatus(200);
        
        $expect = [
            'annotationTimeSeries' => [],
            'volumeAnnotations' => [],
            'volumeName' => $this->volume()->name,
            'annotatedImages' => 1,
            'totalImages' => 2,
            'annotationLabels' => [],
            'sourceTargetLabels' => []
        ];
        $response->assertExactJson($expect);
    }
}
