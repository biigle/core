<?php

class ApiTransectAnnotationControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $transect = TransectTest::create();
        $id = $transect->id;
        $this->project()->addTransectId($id);

        $image = ImageTest::create(['transect_id' => $id]);
        $annotation = AnnotationTest::create([
            'image_id' => $image->id,
            'points' => [10, 20],
        ]);
        $label = AnnotationLabelTest::create(['annotation_id' => $annotation->id]);
        $image2 = ImageTest::create(['transect_id' => $id, 'filename' => 'b.jpg']);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$id}/annotations");

        $this->beUser();
        $this->get("/api/v1/transects/{$id}/annotations");
        $this->assertResponseStatus(403);

        $expect = [
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
            'firstname' => $label->user->firstname,
            'lastname' => $label->user->lastname,
            'id' => $annotation->shape->id,
            'name' => $annotation->shape->name,
            'points' => [10, 20],
        ];

        $dontExpect = [
            'id' => $image2->id,
            'email' => $label->user->email
        ];

        // SQLite converts integers to string
        // Eloquent does convert IDs back but not the IDs of relations or other integers
        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            $expect['image_id'] = "{$expect['image_id']}";
            $expect['shape_id'] = "{$expect['shape_id']}";
        }

        $this->beGuest();
        $this->get("/api/v1/transects/{$id}/annotations")
            ->seeJson($expect)
            // don't include the images without any annotations
            ->dontSeeJson($dontExpect);
    }
}
