<?php

namespace Biigle\Tests\Http\Controllers\Api\Projects;

use ApiTestCase;
use Biigle\AnnotationGuideline;
use Biigle\AnnotationGuidelineLabel;
use Biigle\Label;
use Biigle\Shape;
use Illuminate\Http\UploadedFile;
use Storage;

class AnnotationGuidelineLabelControllerTest extends ApiTestCase
{
    public function testUpdate()
    {
        $id = $this->project()->id;
        $as = AnnotationGuideline::create(['project' => $id, 'description' => 'someDescription']);
        $path = "/api/v1/projects/{$id}/annotation-guideline-label";
        $label1 = Label::factory()->create();

        config(['annotation_guideline.storage_disk' => 'annotation_storage']);
        $disk = Storage::fake('annotation_storage');

        $filename = 'test-image-small.jpg';

        $fileDir = __DIR__."/../../../../../files/";
        $imageFile = new UploadedFile($fileDir.$filename, $filename, test: true);
        $data = [
            'annotation_guideline' => $as->id,
            'label' => $label1->id,
            'shape' => Shape::polygonId(),
            'description' => 'labelDescription',
            'reference_image' =>$imageFile,
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

            $asl = AnnotationGuidelineLabel::where(['annotation_guideline' => $as->id])
                ->get()
                ->toArray();

            $disk->assertExists("{$id}/{$label1->id}.jpg");

            $expected = [[
                'id' => $asl[0]['id'],
                'annotation_guideline' => $as->id,
                'label' => $label1->id,
                'shape' => Shape::polygonId(),
                'description' => 'labelDescription',
            ]];

            $this->assertEquals($asl, $expected);

            $filename = 'file.txt';
            $fakeFile = UploadedFile::fake()->create($filename);
            $data = [
                'annotation_guideline' => $as['id'],
                'label' => $label1->id,
                'shape' => Shape::polygonId(),
                'description' => 'labelDescription',
                'reference_image' => $fakeFile,
            ];

            $this->post($path, $data)
                ->assertStatus(302);

            //Update two other labels, the first label should not be there.
            $label2 = Label::factory()->create();
            $label3 = Label::factory()->create();

            $data = [
                'annotation_guideline' => $as->id,
                'label' => $label2->id,
                'shape' => null,
                'description' => null,
                'reference_image' => $imageFile,
            ];

            $this->post($path, $data)
                ->assertStatus(200);

            $data = [
                'annotation_guideline' => $as->id,
                'label' => $label3->id,
                'shape' => Shape::circleId(),
                'description' => 'aDifferentDescription',
                'reference_image' => null,
            ];

            $this->post($path, $data)
                ->assertStatus(200);


            $asl2 = AnnotationGuidelineLabel::where(['annotation_guideline' => $as->id])
                ->orderBy('label')
                ->get()
                ->toArray();

            $this->assertCount(3, $asl2);

            $expected = [
                [
                    'id' => $asl2[0]['id'],
                    'annotation_guideline' => $as->id,
                    'label' => $label1->id,
                    'shape' => Shape::polygonId(),
                    'description' => 'labelDescription',
                ],
                [
                    'id' => $asl2[1]['id'],
                    'annotation_guideline' => $as->id,
                    'label' => $label2->id,
                    'shape' => null,
                    'description' => null,
                ],
                [
                    'id' => $asl2[2]['id'],
                    'annotation_guideline' => $as->id,
                    'label' => $label3->id,
                    'shape' => Shape::circleId(),
                    'description' => 'aDifferentDescription',
                ],
            ];

            $this->assertEquals($asl2, $expected);


            //Should have been uploaded
            $disk->assertExists("{$id}/{$label2->id}.jpg");

            //Should not exist
            $disk->assertMissing("{$id}/{$label3->id}.jpg");

            //delete
            $path = "/api/v1/projects/{$id}/annotation-guideline-label/delete-image";

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

            $disk->assertMissing("{$id}/{$label2->id}.jpg");
        } finally {
            if (isset($label1) && $disk->exists("{$id}/{$label1->id}.jpg")) {
                $disk->delete("{$id}/{$label1->id}.jpg");
            }
            if (isset($label2) && $disk->exists("{$id}/{$label2->id}.jpg")) {
                $disk->delete("{$id}/{$label2->id}.jpg");
            }
            if (isset($label3) && $disk->exists("{$id}/{$label3->id}.jpg")) {
                $disk->delete("{$id}/{$label2->id}.jpg");
            }
        }
    }

    public function testDelete()
    {
        $id = $this->project()->id;
        $as = AnnotationGuideline::create(['project' => $id, 'description' => 'someDescription']);
        $label = Label::factory()->create();
        AnnotationGuidelineLabel::create(['annotation_strategy' => $as->id, 'label' => $label->id]);

        $path = "/api/v1/projects/{$id}/annotation-guideline-label/delete-image";
        $data = ['label' => $label->id];

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

        $vals = AnnotationGuidelineLabel::where(['annotation_strategy' => $as->id, 'label' => $label->id])->get();
        $this->assertEmpty($vals, 0);
    }
}
