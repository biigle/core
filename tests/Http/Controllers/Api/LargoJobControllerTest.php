<?php

namespace Biigle\Tests\Modules\Largo\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Tests\VolumeTest;

class LargoJobControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $this->doTestApiRoute('GET', 'api/v1/largo-jobs/123');

        $this->beUser();
        $this->get('api/v1/largo-jobs/123')->assertStatus(404);
        VolumeTest::create(['attrs' => ['largo_job_id' => '123']]);
        $this->get('api/v1/largo-jobs/123')->assertStatus(200);
    }
}
