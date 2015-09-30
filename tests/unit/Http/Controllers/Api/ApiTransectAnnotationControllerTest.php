<?php

class ApiTransectAnnotationControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $transect = TransectTest::create();
        $id = $transect->id;
        $this->project->addTransectId($id);

        // call fresh() so the IDs and numbers get strings if SQLite is used for testing
        // so the assertions below work
        $image = ImageTest::create(['transect_id' => $id])->fresh();
        $annotation = AnnotationTest::create(['image_id' => $image->id])->fresh();
        $point = AnnotationPointTest::create(['annotation_id' => $annotation->id])->fresh();
        $label = AnnotationLabelTest::create(['annotation_id' => $annotation->id])->fresh();

        $this->doTestApiRoute('GET', '/api/v1/transects/'.$id.'/annotations');

        // api key authentication
        $this->callToken('GET', '/api/v1/transects/'.$id.'/annotations', $this->user);
        $this->assertResponseStatus(401);

        $this->callToken('GET', '/api/v1/transects/'.$id.'/annotations', $this->guest);
        $this->assertResponseOk();

        // session cookie authentication
        $this->be($this->guest);
        $this->get('/api/v1/transects/'.$id.'/annotations')
            ->seeJson([
                'id' => $image->id,
                'filename' => $image->filename,
                'id' => $annotation->id,
                'image_id' => $image->id,
                'shape_id' => $annotation->shape->id,
                'id' => $label->id,
                'confidence' => $label->confidence,
                'id' => $label->label->id,
                'name' => $label->label->name,
                'id' => $label->user->id,
                'name' => $label->user->name,
                'id' => $annotation->shape->id,
                'name' => $annotation->shape->name,
                'x' => $point->x,
                'y' => $point->y
            ]);
    }
}
