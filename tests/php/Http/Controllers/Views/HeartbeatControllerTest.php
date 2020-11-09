<?php

namespace Biigle\Tests\Http\Controllers\Views;

use Biigle\Tests\UserTest;
use TestCase;

class HeartbeatControllerTest extends TestCase
{
    public function testShowWhenNotLoggedIn()
    {
        $this->post('heartbeat')->assertStatus(204);
    }

    public function testShowWhenLoggedIn()
    {
        $user = UserTest::create();
        $user->login_at = null;
        $user->save();
        $this->actingAs($user)->post('heartbeat')->assertStatus(204);
        $this->assertNull($user->fresh()->login_at);
    }
}
