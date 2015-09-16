<?php

class TransectsAdminControllerTest extends TestCase {

   public function testIndex()
   {
        $this->visit("admin/transects")->seePageIs('auth/login');
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/transects")->assertResponseStatus(401);
        $user->role()->associate(Dias\Role::$admin);
        $this->visit("admin/transects")->assertResponseOk();
   }
}
