<?php

namespace Biigle\Tests\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Volumes\VolumeCloneController;
use ApiTestCase;
use Biigle\ImageAnnotationLabel;
use Biigle\ImageLabel;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;

class VolumeCloneControllerTest extends ApiTestCase
{

    function testClone()
    {

        $id = $this->volume()->id;
        $img = ImageTest::create(
            ['filename' => 'abx.jpg',
                'volume_id' => $id]);
        ImageLabelTest::create(['image_id' => $img->id]);
        ImageLabelTest::create(['image_id' => $img->id]);
        ImageLabelTest::create(['image_id' => $img->id]);

        $a = ImageAnnotationTest::create(['image_id'=>$img->id]);
        ImageAnnotationLabelTest::create(['annotation_id'=> $a->id]);
        ImageAnnotationLabelTest::create(['annotation_id'=> $a->id]);


        $img2 = ImageTest::create(
            ['filename' => 'hgfhf.jpg',
                'volume_id' => $id]);
        ImageLabelTest::create(['image_id' => $img2->id]);

        $a2 = ImageAnnotationTest::create(['image_id'=>$img2->id]);
        ImageAnnotationLabelTest::create(['annotation_id'=> $a2->id]);
        ImageAnnotationLabelTest::create(['annotation_id'=> $a2->id]);
        ImageAnnotationLabelTest::create(['annotation_id'=> $a2->id]);
        ImageAnnotationLabelTest::create(['annotation_id'=> $a2->id]);



        $this->beAdmin();
        $response = $this->get("volumes/clone/{$id}");
        $response->assertStatus(200);
    }

}
