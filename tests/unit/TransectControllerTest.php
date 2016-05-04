<?php

class TransectControllerTest extends ApiTestCase {

    public function testIndex() {
        $id = $this->transect()->id;

        // not logged in
        $this->get("transects/{$id}");
        $this->assertResponseStatus(302);

        // doesn't belong to project
        $this->beUser();
        $this->get("transects/{$id}");
        $this->assertResponseStatus(401);

        $this->beEditor();
        $this->get("transects/{$id}");
        $this->assertResponseOk();
        $this->assertViewHas('isAdmin', false);

        $this->beAdmin();
        $this->get("transects/{$id}");
        $this->assertResponseOk();
        $this->assertViewHas('isAdmin', true);

        // doesn't exist
        $this->get('projects/-1');
        $this->assertResponseStatus(404);
    }

    public function testCreate() {
        $id = $this->project()->id;

        // not logged in
        $this->get('transects/create');
        $this->assertResponseStatus(302);

        $this->beEditor();
        // user is not allowed to edit the project
        $this->get('transects/create?project='.$id);
        $this->assertResponseStatus(401);

        $this->beAdmin();
        // project doesn't exist
        $this->get('transects/create?project=-1');
        $this->assertResponseStatus(404);

        $this->get('transects/create?project='.$id);
        $this->assertResponseOk();
    }

    public function testEdit() {
        $id = $this->transect()->id;

        $this->beUser();
        $this->get("transects/edit/{$id}");
        $this->assertResponseStatus(401);

        $this->beGuest();
        $this->get("transects/edit/{$id}");
        $this->assertResponseStatus(401);

        $this->beEditor();
        $this->get("transects/edit/{$id}");
        $this->assertResponseStatus(401);

        // even the transect creator is not allowed if they are no project admin
        $this->be($this->transect()->creator);
        $this->get("transects/edit/{$id}");
        $this->assertResponseStatus(401);

        $this->beAdmin();
        $this->get("transects/edit/{$id}");
        $this->assertResponseOk();

        $this->get("transects/edit/999");
        $this->assertResponseStatus(404);
    }
}
