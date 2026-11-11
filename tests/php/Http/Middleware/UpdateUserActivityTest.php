<?php

namespace Biigle\Tests\Http\Middleware;

use ApiTestCase;

class UpdateUserActivityTest extends ApiTestCase
{
    public function testTerminate()
    {
        config(['biigle.email_verification' => false]);

        $this->assertNull($this->user()->login_at);
        $this->be($this->user());
        $this->get('/');
        $this->assertNotNull($this->user()->fresh()->login_at);
    }
}
