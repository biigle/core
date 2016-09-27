<?php

use Dias\Modules\Export\Transect;

class ExportModuleHttpControllersViewsTransectsReportControllerTest extends ApiTestCase {

    public function testShow()
    {
        $id = $this->transect()->id;

        $this->get("transects/{$id}/reports")
            ->assertResponseStatus(302);

        $this->beUser();
        $this->get("transects/{$id}/reports")
            ->assertResponseStatus(403);

        $this->beGuest();
        $this->get("transects/{$id}/reports")
            ->assertResponseOk();
    }
}
