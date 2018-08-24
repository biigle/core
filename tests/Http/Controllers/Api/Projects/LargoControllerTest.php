<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api\Projects;

use Biigle\Tests\Modules\Largo\Http\Controllers\Api\LargoControllerTestBase;

class LargoControllerTest extends LargoControllerTestBase
{
    protected function getUrl()
    {
        $id = $this->project()->id;

        return "/api/v1/projects/{$id}/largo";
    }
}
