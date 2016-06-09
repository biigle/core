<?php

use Dias\Visibility;

class LabelTreesModuleHttpControllersLabelTreeControllerTest extends TestCase
{
    public function testIndex() {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::$public->id]);
        $user = UserTest::create();

        $privateTree = LabelTreeTest::create(['visibility_id' => Visibility::$private->id]);

        // not logged in
        $this->get("label-trees/{$tree->id}");
        $this->assertRedirectedTo('auth/login');

        $this->be($user);
        $this->get("label-trees/{$tree->id}");
        $this->assertResponseOk();

        $this->get("label-trees/{$privateTree->id}");
        $this->assertResponseStatus(403);

        // doesn't exist
        $this->get('label-trees/-1');
        $this->assertResponseStatus(404);
    }

    public function testAdmin() {
        $this->visit("admin/label-trees")->seePageIs('auth/login');
        $user = UserTest::create();
        $this->be($user);
        $this->get("admin/label-trees")->assertResponseStatus(401);
        $user->role()->associate(Dias\Role::$admin);
        $this->visit("admin/label-trees")->assertResponseOk();
    }
}
