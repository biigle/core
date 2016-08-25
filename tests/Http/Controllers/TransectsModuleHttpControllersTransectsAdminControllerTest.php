<?php

class TransectsModuleHttpControllersTransectsAdminControllerTest extends TestCase {

   public function testIndex()
   {
        $this->visit("admin/transects")->seePageIs('login');
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/transects")->assertResponseStatus(403);
        $user->role()->associate(Dias\Role::$admin);
        $this->visit("admin/transects")->assertResponseOk();
   }
}
