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
        $project->addUserId($user->id, Role::guestId());
        $project2->addUserId($user->id, Role::adminId());

        $this->be($user);
        $response = $this->get('search')->assertStatus(200);
        $response->assertSeeText('random name');
        $response->assertSeeText('another project');
        $response->assertDontSeeText('and again');

        $response = $this->get('search?t=projects')->assertStatus(200);
        $response->assertSeeText('random name');
        $response->assertSeeText('another project');
        $response->assertDontSeeText('and again');

        $response = $this->get('search?q=name')->assertStatus(200);
        $response->assertStatus(200);
        $response->assertSeeText('random name');
        $response->assertDontSeeText('another project');
        $response->assertDontSeeText('and again');
    }
}
