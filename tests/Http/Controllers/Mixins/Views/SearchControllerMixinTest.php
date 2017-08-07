<?php

namespace Biigle\Tests\Modules\Projects\Http\Controllers\Mixins\Views;

use TestCase;
use Biigle\Role;
use Biigle\Tests\UserTest;
use Biigle\Tests\ProjectTest;

class SearchControllerMixinTest extends TestCase
{
    public function testIndex()
    {
        $user = UserTest::create();
        $project = ProjectTest::create(['name' => 'random name']);
        $project2 = ProjectTest::create(['name' => 'another project']);
        $project3 = ProjectTest::create(['name' => 'and again']);
        $project->addUserId($user->id, Role::$guest->id);
        $project2->addUserId($user->id, Role::$admin->id);

        $this->be($user);
        $this->get('search')->assertResponseOk();
        $this->see('random name');
        $this->see('another project');
        $this->dontSee('and again');

        $this->get('search?t=projects')->assertResponseOk();
        $this->see('random name');
        $this->see('another project');
        $this->dontSee('and again');

        $this->get('search?q=name')->assertResponseOk();
        $this->assertResponseOk();
        $this->see('random name');
        $this->dontSee('another project');
        $this->dontSee('and again');
    }
}
