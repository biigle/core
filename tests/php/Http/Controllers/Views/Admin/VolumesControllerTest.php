<?php

namespace Biigle\Tests\Http\Controllers\Views\Admin;

use Biigle\Role;
use Biigle\Tests\UserTest;
use TestCase;

class VolumesControllerTest extends TestCase
{
    public function testIndex()
    {
        $this->get('admin/volumes')->assertRedirect('login');
        $user = UserTest::create();
        $this->be($user);
        $response = $this->get('admin/volumes')->assertStatus(403);
        $user->role()->associate(Role::admin());
        $this->get('admin/volumes')->assertStatus(200);
    }
}
