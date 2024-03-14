<?php

namespace Biigle\Tests\Http\Controllers\Views\Volumes;

use ApiTestCase;
use Biigle\PendingVolume;

class PendingVolumeControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $pv = PendingVolume::factory()->create([
            'user_id' => $this->admin()->id,
            'project_id' => $this->project()->id,
        ]);

        // not logged in
        $this->get("pending-volumes/{$pv->id}")->assertStatus(302);

        // doesn't belong to pending volume
        $this->beExpert();
        $this->get("pending-volumes/{$pv->id}")->assertStatus(403);

        $this->beAdmin();
        $this->get("pending-volumes/{$pv->id}")->assertStatus(200);
    }
}
