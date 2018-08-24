<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Volumes;

use Biigle\Tests\Modules\Largo\Http\Controllers\Api\LargoControllerTestBase;

class LargoControllerTest extends LargoControllerTestBase
{
    protected function getUrl()
    {
        $id = $this->volume()->id;

        return "/api/v1/volumes/{$id}/largo";
    }
}
