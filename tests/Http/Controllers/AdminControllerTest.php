<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;

class AdminControllerTest extends TestCase
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
