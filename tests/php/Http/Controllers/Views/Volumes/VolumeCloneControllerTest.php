<?php

namespace Biigle\Tests\Http\Controllers\Views\Volumes;

use ApiTestCase;

class VolumeCloneControllerTest extends ApiTestCase
{
    public function testClone()
    {
        $id = $this->volume()->id;

        $this->beUser();
        $response = $this->get("volumes/clone/{$id}");
        $response->assertStatus(403);

        $this->beGuest();
        $response = $this->get("volumes/clone/{$id}");
        $response->assertStatus(403);

        $this->beEditor();
        $response = $this->get("volumes/clone/{$id}");
        $response->assertStatus(403);

        $this->beExpert();
        $response = $this->get("volumes/clone/{$id}");
        $response->assertStatus(403);

        // even the volume creator is not allowed if they are no project admin
        $this->be($this->volume()->creator);
        $response = $this->get("volumes/clone/{$id}");
        $response->assertStatus(403);

        // if project creator and volume creator are the same, the volume can be cloned
        $this->be($this->project()->creator);
        $response = $this->get("volumes/clone/{$id}");
        $response->assertStatus(200);

        $this->beAdmin();
        $response = $this->get("volumes/clone/{$id}");
        $response->assertStatus(200);

        $response = $this->get('volumes/clone/0');
        $response->assertStatus(404);
    }
}
