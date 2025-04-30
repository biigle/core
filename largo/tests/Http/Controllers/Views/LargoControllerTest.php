<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Views;

use ApiTestCase;
use Biigle\MediaType;

class LargoControllerTest extends ApiTestCase
{
    public function testIndexImageVolume()
    {
        $id = $this->volume()->id;

        $this->get("volumes/{$id}/largo")->assertStatus(302);

        $this->beGuest();
        $this->get("volumes/{$id}/largo")->assertStatus(403);

        $this->beEditor();
        $this->get("volumes/{$id}/largo")->assertStatus(200);

        $this->beGlobalAdmin();
        $this->get("volumes/{$id}/largo")->assertStatus(200);
    }

    public function testIndexVideoVolume()
    {
        $id = $this->volume(['media_type_id' => MediaType::videoId()])->id;
        $this->get("volumes/{$id}/largo")->assertStatus(302);

        $this->beGuest();
        $this->get("volumes/{$id}/largo")->assertStatus(403);

        $this->beEditor();
        $this->get("volumes/{$id}/largo")->assertStatus(200);

        $this->beGlobalAdmin();
        $this->get("volumes/{$id}/largo")->assertStatus(200);
    }

    public function testIndexProject()
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
