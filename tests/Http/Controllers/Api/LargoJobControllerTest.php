<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\VolumeTest;

class LargoJobControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $uuid = '2fd5efe2-1bb8-47cf-a655-81707a367626';
        $this->doTestApiRoute('GET', "api/v1/largo-jobs/{$uuid}");

        $this->beUser();
        $this->get("api/v1/largo-jobs/{$uuid}")->assertStatus(404);
        VolumeTest::create(['attrs' => ['largo_job_id' => $uuid]]);
        $this->get("api/v1/largo-jobs/{$uuid}")->assertStatus(200);
    }
}
