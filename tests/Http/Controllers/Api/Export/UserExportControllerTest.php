<?php

namespace Biigle\Tests\Modules\Sync\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\Tests\UserTest;

class UserExportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $this->doTestApiRoute('GET', '/api/v1/export/users');

        $this->beAdmin();
        $this->get('/api/v1/export/users')->assertStatus(403);

        $this->beGlobalAdmin();
        $response = $this->get('/api/v1/export/users')
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/zip')
            ->assertHeader('content-disposition', 'attachment; filename="biigle_user_export.zip"');
    }
}
