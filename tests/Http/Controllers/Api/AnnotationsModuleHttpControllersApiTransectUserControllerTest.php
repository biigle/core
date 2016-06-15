<?php

class AnnotationsModuleHttpControllersApiTransectUserControllerTest extends ApiTestCase {

    public function testIndex() {
        $tid = $this->transect()->id;

        $user1 = UserTest::create(['firstname' => 'joe', 'lastname' => 'user']);
        $user2 = UserTest::create(['firstname' => 'jane', 'lastname' => 'user']);
        $user3 = UserTest::create(['firstname' => 'jack', 'lastname' => 'user']);

        $image = ImageTest::create(['transect_id' => $tid]);
        $annotation = AnnotationTest::create(['image_id' => $image->id]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $user1->id,
        ]);
        $label = AnnotationLabelTest::create([
            'annotation_id' => $annotation->id,
            'user_id' => $user2->id,
        ]);

        $this->doTestApiRoute('GET', "/api/v1/transects/{$tid}/users/find/joe");

        $this->beUser();
        $this->get("/api/v1/transects/{$tid}/users/find/joe");
        $this->assertResponseStatus(403);

        $this->beGuest();
        $this->get("/api/v1/transects/{$tid}/users/find/joe");
        $this->assertResponseOk();

        $this->get("/api/v1/transects/{$tid}/users/find/joe")
            ->seeJsonEquals([[
                'id' => $user1->id,
                'firstname' => $user1->firstname,
                'lastname' => $user1->lastname,
            ]]);

        $this->get("/api/v1/transects/{$tid}/users/find/user")
            ->seeJsonEquals([
                [
                    'id' => $user1->id,
                    'firstname' => $user1->firstname,
                    'lastname' => $user1->lastname,
                ],
                [
                    'id' => $user2->id,
                    'firstname' => $user2->firstname,
                    'lastname' => $user2->lastname,
                ]
            ]);
    }
}
