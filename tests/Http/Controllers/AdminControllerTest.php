<?php

namespace Biigle\Tests\Modules\Transects\Http\Controllers;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;

class AdminControllerTest extends TestCase
{
   public function testIndex()
   {
        $this->visit("admin/transects")->seePageIs('login');
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/transects")->assertResponseStatus(403);
        $user->role()->associate(Role::$admin);
        $this->visit("admin/transects")->assertResponseOk();
   }
}
