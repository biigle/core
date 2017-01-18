<?php

namespace Biigle\Tests\Modules\LabelTrees\Http\Controllers;

use TestCase;
use Biigle\Role;
use Biigle\Visibility;
use Biigle\Tests\UserTest;
use Biigle\Tests\LabelTreeTest;

class LabelTreeControllerTest extends TestCase
{
    public function testShow()
    {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::$public->id]);
        $user = UserTest::create();

        $privateTree = LabelTreeTest::create(['visibility_id' => Visibility::$private->id]);

        // not logged in
        $this->get("label-trees/{$tree->id}");
        $this->assertRedirectedTo('login');

        $this->be($user);
        $this->get("label-trees/{$tree->id}");
        $this->assertResponseOk();

        $this->get("label-trees/{$privateTree->id}");
        $this->assertResponseStatus(403);

        // doesn't exist
        $this->get('label-trees/-1');
        $this->assertResponseStatus(404);
    }

    public function testAdmin()
    {
        $this->visit('admin/label-trees')->seePageIs('login');
        $user = UserTest::create();
        $this->be($user);
        $this->get('admin/label-trees')->assertResponseStatus(403);
        $user->role()->associate(Role::$admin);
        $this->visit('admin/label-trees')->assertResponseOk();
    }

    public function testIndex()
    {
        $user = UserTest::create();
        $tree = LabelTreeTest::create(['name' => 'random name']);
        $tree2 = LabelTreeTest::create(['name' => 'another tree']);
        $tree3 = LabelTreeTest::create([
            'name' => 'private one',
            'visibility_id' => Visibility::$private->id,
        ]);
        $tree->addMember($user, Role::$editor);

        $this->visit('label-trees')->seePageIs('login');

        $this->be($user);
        $this->get('label-trees')->assertResponseOk();
        $this->see('random name');
        $this->see('another tree');
        $this->dontSee('private one');

        $this->call('GET', 'label-trees', ['query' => 'name']);
        $this->assertResponseOk();
        $this->see('random name');
        $this->dontSee('another tree');
        $this->dontSee('private one');
    }

    public function testCreate()
    {
        $this->visit('label-trees/create')->seePageIs('login');
        $user = UserTest::create();
        $this->be($user);
        $this->visit('label-trees/create')->assertResponseOk();
    }
}
