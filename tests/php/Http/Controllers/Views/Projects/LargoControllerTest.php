<?php

namespace Biigle\Tests\Http\Controllers\Views\Projects;

use ApiTestCase;
use Biigle\MediaType;

class LargoControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = $this->project()->id;

        $this->get("projects/{$id}/largo")->assertStatus(302);

        $this->beGuest();
        $this->get("projects/{$id}/largo")->assertStatus(403);

        $this->beEditor();
        $this->get("projects/{$id}/largo")->assertStatus(404);
        $volume = $this->volume();
        $this->get("projects/{$id}/largo")->assertStatus(200);
        $volume->media_type_id = MediaType::videoId();
        $volume->save();
        $this->get("projects/{$id}/largo")->assertStatus(200);

        $this->beGlobalAdmin();
        $this->get("projects/{$id}/largo")->assertStatus(200);
    }
}
