<?php

class AnnotationsModuleHttpControllersApiTransectLabelControllerTest extends ApiTestCase {

    public function testFind() {
        $tid = $this->transect()->id;

        $label1 = LabelTest::create(['name' => 'my-label']);
        $image = ImageTest::create(['transect_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        AnnotationLabelTest::create([
            'label_id' => $label1->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);
        $label2 = LabelTest::create(['name' => 'other-label']);
        AnnotationLabelTest::create([
            'label_id' => $label2->id,
            'annotation_id' => $annotation->id,
            'user_id' => $this->editor()->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$tid}/labels/find/my");

        $this->beUser();
        $this->get("/api/v1/transects/{$tid}/labels/find/my");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/labels/find/my")
            // other-label should not appear
            ->seeJsonEquals([[
                'id' => $label1->id,
                'name' => $label1->name,
                'color' => $label1->color,
                'parent_id' => $label1->parent_id,
                'aphia_id' => $label1->aphia_id,
            ]]);
        $this->assertResponseOk();

        $this->get("/api/v1/transects/{$tid}/labels/find/label")
            ->seeJsonEquals([
                [
                    'id' => $label1->id,
                    'name' => $label1->name,
                    'color' => $label1->color,
                    'parent_id' => $label1->parent_id,
                    'aphia_id' => $label1->aphia_id,
                ],
                [
                    'id' => $label2->id,
                    'name' => $label2->name,
                    'color' => $label2->color,
                    'parent_id' => $label2->parent_id,
                    'aphia_id' => $label2->aphia_id,
                ]
            ]);
    }
}
