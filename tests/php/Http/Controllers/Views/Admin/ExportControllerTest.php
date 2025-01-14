<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use ApiTestCase;

class ExportControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->beAdmin();
        $this->get('admin/export')->assertStatus(403);

        $this->beGlobalAdmin();
        $this->get('admin/export')->assertStatus(200);
        $this->get('admin')->assertSee('Export');

        config(['sync.allowed_exports' => []]);

        $this->beGlobalAdmin();
        $this->get('admin/export')->assertStatus(404);
        $this->get('admin')->assertDontSee('Export');
    }
}
