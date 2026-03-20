<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\AnnotationStrategy;
use Biigle\AnnotationStrategyLabel;
use Biigle\Label;
use Biigle\Shape;
use Illuminate\Http\UploadedFile;
use Storage;

class AnnotationStrategyLabelControllerTest extends ApiTestCase
{
    public function testUpdate()
    {
        $id = $this->project()->id;
        $as = AnnotationStrategy::create(['project' => $id, 'description' => 'someDescription']);
        $path = "/api/v1/projects/{$id}/annotation-strategy-label";
        $label1 = Label::factory()->create();

        config(['annotation_strategy.storage_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $filename = 'test-image.jpg';

        $fileDir = __DIR__."/../../../../../files/";
        $imageFile = new UploadedFile($fileDir.$filename, $filename, test: true);
        $data = [
            'annotation_strategy' => $as->id,
            'labels' => [$label1->id],
            'shapes' => [Shape::polygonId()],
            'descriptions' => ['labelDescription'],
            'reference_images' => [$imageFile],
        ];

        try {
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

            $disk->assertExists("{$id}/{$label1->id}/original");
            $disk->assertExists("{$id}/{$label1->id}/thumbnail");

            $expected = [[
                'annotation_strategy' => $as->id,
                'label' => $label1->id,
                'shape' => Shape::polygonId(),
                'description' => 'labelDescription',
            ]];

            $this->assertEquals($asl, $expected);

            $filename = 'file.txt';
            $fakeFile = UploadedFile::fake()->create($filename);
            $data = [
                'annotation_strategy' => $as->id,
                'labels' => [$label1->id],
                'shapes' => [Shape::polygonId()],
                'descriptions' => ['labelDescription'],
                'reference_images' => [$fakeFile],
            ];

            $this->post($path, $data)
                ->assertStatus(302);

            $imageFile = new UploadedFile($fileDir."test-image.png", "test-image.png", test: true);

            //Update two other labels, the first label should not be there.
            $label2 = Label::factory()->create();
            $label3 = Label::factory()->create();
            $label4 = Label::factory()->create();
            $data = [
                'annotation_strategy' => $as->id,
                'labels' => [$label2->id, $label3->id, $label4->id],
                'shapes' => [null, Shape::circleId(), Shape::pointId()],
                'descriptions' => ['labelDescription', 'aDifferentDescription', 'anotherOne'],
                'reference_images' => [$imageFile, null, null],
            ];

            $this->post($path, $data)
                ->assertStatus(200);


            $asl2 = AnnotationStrategyLabel::where(['annotation_strategy' => $as->id])
                ->get()
                ->toArray();

            $expected = [
                [
                    'annotation_strategy' => $as->id,
                    'label' => $label2->id,
                    'shape' => null,
                    'description' => 'labelDescription',
                ],
                [
                    'annotation_strategy' => $as->id,
                    'label' => $label3->id,
                    'shape' => Shape::circleId(),
                    'description' => 'aDifferentDescription',
                ],
                [
                    'annotation_strategy' => $as->id,
                    'label' => $label4->id,
                    'shape' => Shape::pointId(),
                    'description' => 'anotherOne',
                ],
            ];

            $asl = AnnotationStrategyLabel::where(['annotation_strategy' => $as->id])
                ->get()
                ->toArray();

            $this->assertEquals($asl2, $expected);

            //Should have been deleted
            $disk->assertMissing("{$id}/{$label1->id}/original");
            $disk->assertMissing("{$id}/{$label1->id}/thumbnail");

            //Should have been uploaded
            $disk->assertExists("{$id}/{$label2->id}/original");
            $disk->assertExists("{$id}/{$label2->id}/thumbnail");

            //Should not exist
            $disk->assertMissing("{$id}/{$label3->id}/original");
            $disk->assertMissing("{$id}/{$label3->id}/thumbnail");

            //delete
            $path = "/api/v1/projects/{$id}/annotation-strategy-label/delete-image";

            $data = ['label' => $label2->id];

            $this->beGuest();
            $this->delete($path, $data)
                ->assertStatus(403);

            $this->beUser();
            $this->delete($path, $data)
                ->assertStatus(403);

            $this->beEditor();
            $this->delete($path, $data)
                ->assertStatus(403);

            $this->beAdmin();
            $this->delete($path, $data)
                ->assertStatus(200);

            $disk->assertMissing("{$id}/{$label2->id}");
        } finally {
            if (isset($label1) && $disk->exists("{$id}/{$label1->id}")) {
                $disk->deleteDirectory("{$id}/{$label1->id}");
            }
            if (isset($label2) && $disk->exists("{$id}/{$label2->id}")) {
                $disk->deleteDirectory("{$id}/{$label2->id}");
            }
            if (isset($label3) && $disk->exists("{$id}/{$label3->id}")) {
                $disk->deleteDirectory("{$id}/{$label2->id}");
            }
        }

    }
}
