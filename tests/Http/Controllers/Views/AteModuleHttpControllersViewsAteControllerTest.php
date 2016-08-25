<?php

class AteModuleHttpControllersViewsAteControllerTest extends ApiTestCase {

    public function testIndexTransect() {
        $id = $this->transect()->id;

        $this->get("transects/{$id}/ate")
            ->assertResponseStatus(302);

        $this->beGuest();
        $this->get("transects/{$id}/ate")
            ->assertResponseStatus(403);

        $this->beEditor();
        $this->get("transects/{$id}/ate")
            ->assertResponseOk();
    }

    public function testIndexProject() {
        $id = $this->project()->id;

        $this->get("projects/{$id}/ate")
            ->assertResponseStatus(302);

        $this->beGuest();
        $this->get("projects/{$id}/ate")
            ->assertResponseStatus(403);

        $this->beEditor();
        $this->get("projects/{$id}/ate")
            ->assertResponseOk();
    }
}
