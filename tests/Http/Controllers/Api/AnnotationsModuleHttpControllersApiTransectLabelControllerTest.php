<?php

class AnnotationsModuleHttpControllersApiTransectLabelControllerTest extends ApiTestCase {

    public function testFind() {
        $tid = $this->transect()->id;

        $label = LabelTest::create(['name' => 'my-label']);
        LabelTest::create(['name' => 'other-label']);
        $image = ImageTest::create(['transect_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        AnnotationLabelTest::create([
            'label_id' => $label->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$tid}/labels/find/label");

        $this->beUser();
        $this->get("/api/v1/transects/{$tid}/labels/find/label");
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/labels/find/label")
            // other-label should not appear
            ->seeJsonEquals([[
                'id' => $label->id,
                'name' => $label->name,
                'color' => $label->color,
                'parent_id' => $label->parent_id,
                'aphia_id' => $label->aphia_id,
            ]]);
        $this->assertResponseOk();
    }
}
