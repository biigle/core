<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Labels;

use ApiTestCase;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;

class ImageAnnotationsControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $label = LabelTest::create();
        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        ImageAnnotationLabelTest::create(['label_id' => $label->id, 'annotation_id' => $a1->id]);
        $a2 = ImageAnnotationTest::create(['image_id' => $image->id]);
        ImageAnnotationLabelTest::create(['label_id' => $label->id, 'annotation_id' => $a2->id]);
        $a3 = ImageAnnotationTest::create(['image_id' => $image->id]);
        ImageAnnotationLabelTest::create(['annotation_id' => $a3->id]);

        $this->doTestApiRoute('GET', "/api/v1/labels/{$label->id}/image-annotations");

        $this->beUser();
        $this->get("/api/v1/labels/{$label->id}/image-annotations")
            ->assertStatus(200)
            ->assertExactJson([]);

        $this->beGuest();
        $this->get("/api/v1/labels/{$label->id}/image-annotations")
            ->assertStatus(200)
            ->assertExactJson([
                $a2->id => $image->uuid,
                $a1->id => $image->uuid
            ]);

        // Show the newest annotation first.
        $this->get("/api/v1/labels/{$label->id}/image-annotations?take=1")
            ->assertStatus(200)
            ->assertExactJson([$a2->id => $image->uuid]);

        $this->beGlobalAdmin();
        $this->get("/api/v1/labels/{$label->id}/image-annotations?take=1")
            ->assertStatus(200);
    }

    public function testIndexDuplicates()
    {
        $image = ImageTest::create(['volume_id' => $this->volume()->id]);
        $label = LabelTest::create();
        $a1 = ImageAnnotationTest::create(['image_id' => $image->id]);
        ImageAnnotationLabelTest::create(['label_id' => $label->id, 'annotation_id' => $a1->id]);
        ImageAnnotationLabelTest::create(['label_id' => $label->id, 'annotation_id' => $a1->id]);

        $this->beGuest();
        $this->get("/api/v1/labels/{$label->id}/image-annotations")
            ->assertExactJson([$a1->id => $image->uuid]);
    }
}
