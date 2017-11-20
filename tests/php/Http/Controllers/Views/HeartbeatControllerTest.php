<?php

namespace Biigle\Tests\Http\Controllers\Views;

use TestCase;
use Biigle\Tests\UserTest;

class HeartbeatControllerTest extends TestCase
{
    public function testShowWhenNotLoggedIn()
    {
        $this->post('heartbeat')->assertRedirect('login');
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
