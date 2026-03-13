<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use Illuminate\Http\UploadedFile;
use ApiTestCase;
use Biigle\AnnotationStrategy;
use Biigle\AnnotationStrategyLabel;
use Biigle\Shape;
use Biigle\Label;
use File;
use Storage;

class AnnotationStrategyLabelControllerTest extends ApiTestCase
{
    public function testUpdate() {
        $id = $this->project()->id;
        $as = AnnotationStrategy::create(['project' => $id, 'description' => 'someDescription']);
        $path = "/api/v1/projects/{$id}/annotation-strategy-label";
        $label = Label::factory()->create();
        $data = [
            'annotation_strategy' => $as->id,
            'labels' => [$label->id],
            'shapes' => [Shape::polygonId()],
            'descriptions' => ['labelDescription'],
            'reference_images' => ['file.jpg'],
        ];
        $this->doTestApiRoute('POST', $path);

        $this->beGuest();
        $this->post($path, $data)
            ->assertStatus(403);

        $this->beUser();
        $this->post($path, $data)
            ->assertStatus(403);

        $this->beEditor();
        $this->post($path, $data)
            ->assertStatus(403);

        $this->beAdmin();
        $this->post($path, $data)
            ->assertStatus(200);

        $asl = AnnotationStrategyLabel::where(['annotation_strategy' => $as->id])
            ->get()
            ->toArray();

        $expected = [[
            'annotation_strategy' => $as->id,
            'label' => $label->id,
            'shape' => Shape::polygonId(),
            'description' => 'labelDescription',
            'reference_image' => 'file.jpg',
        ]];

        $this->assertEquals($asl, $expected);

        //Update two other labels, the first label should not be there.
        $label2 = Label::factory()->create();
        $label3 = Label::factory()->create();
        $data = [
            'annotation_strategy' => $as->id,
            'labels' => [$label2->id, $label3->id],
            'shapes' => [null, Shape::circleId()],
            'descriptions' => ['labelDescription', 'aDifferentDescription'],
            'reference_images' => ['file.png', null],
        ];

        $this->post($path, $data)
            ->assertStatus(200);

        $asl = AnnotationStrategyLabel::where(['annotation_strategy' => $as->id])
            ->get()
            ->toArray();

        $expected = [
            [
                'annotation_strategy' => $as->id,
                'label' => $label2->id,
                'shape' => null,
                'description' => 'labelDescription',
                'reference_image' => 'file.png',
            ],
            [
                'annotation_strategy' => $as->id,
                'label' => $label3->id,
                'shape' => Shape::circleId(),
                'description' => 'aDifferentDescription',
                'reference_image' => null,
            ],
        ];

        $asl = AnnotationStrategyLabel::where(['annotation_strategy' => $as->id])
            ->get()
            ->toArray();

        $this->assertEquals($asl, $expected);
    }

    public function testReferenceImageUploadAndDelete()
    {
        config(['annotation_strategy.storage_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');
        $id = $this->project()->id;

        //upload
        $path = "/api/v1/projects/{$id}/annotation-strategy-label/upload-image";

        $textData = ['file' => UploadedFile::fake()->create('file.txt')];
        $imageData = ['file' => UploadedFile::fake()->create('image.png')];

        $this->doTestApiRoute('POST', $path);

        $this->beGuest();
        $this->post($path, $imageData)
            ->assertStatus(403);

        $this->beUser();
        $this->post($path, $imageData)
            ->assertStatus(403);

        $this->beEditor();
        $this->post($path, $imageData)
            ->assertStatus(403);

        $this->beAdmin();
        $response = $this->post($path, $imageData);
        $response->assertStatus(200);
        $filename = $response->json()['filename'];

        $this->post($path, $textData)
            ->assertStatus(302);

        $disk->assertExists("{$id}/{$filename}");

        //delete
        $path = "/api/v1/projects/{$id}/annotation-strategy-label/delete-image";

        $this->delete($path, ['filename' => $filename])
            ->assertStatus(200);

        $disk->assertMissing("{$id}/image.png");
    }
}
