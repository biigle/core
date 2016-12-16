<?php

namespace Dias\Tests\Http\Controllers\Views\Notifications;

use TestCase;
use Dias\Tests\UserTest;

class NotificationsControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('notifications')->seePageIs('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $user = UserTest::create();
        $this->actingAs($user)->visit('notifications')->seePageIs('notifications');
    }
}
