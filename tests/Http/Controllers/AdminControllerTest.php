<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;

class AdminControllerTest extends TestCase
{
   public function testIndex()
   {
        $this->visit("admin/volumes")->seePageIs('login');
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/volumes")->assertResponseStatus(403);
        $user->role()->associate(Role::$admin);
        $this->visit("admin/volumes")->assertResponseOk();
   }
}
