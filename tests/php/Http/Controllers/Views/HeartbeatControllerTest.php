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
        $this->actingAs(UserTest::create())->post('heartbeat')->assertStatus(204);
    }
}
