<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\MediaType;
use Biigle\Tests\Modules\Largo\Http\Controllers\Api\LargoControllerTestBase;

class LargoControllerTest extends LargoControllerTestBase
{
    public function testStoreVideoVolume()
    {
        $volume = $this->volume();
        $volume->media_type_id = MediaType::videoId();
        $volume->save();
        $this->beEditor();
        $this->post("/api/v1/volumes/{$volume->id}/largo")->assertStatus(400);
    }

    protected function getUrl()
    {
        $id = $this->volume()->id;

        return "/api/v1/volumes/{$id}/largo";
    }
}
